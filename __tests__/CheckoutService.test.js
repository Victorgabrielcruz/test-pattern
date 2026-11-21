import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { Pedido } from '../src/domain/Pedido.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';
import { UserMother } from './builders/UserMother.js';

describe('CheckoutService', () => {
    describe('quando o pagamento falha', () => {
        test('retorna null sem persistir pedido ou enviar confirmação', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder().build();
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: false }) };
            const repositoryDummy = { salvar: jest.fn() };
            const emailDummy = { enviarEmail: jest.fn() };
            const checkout = new CheckoutService(gatewayStub, repositoryDummy, emailDummy);

            // Act
            const pedido = await checkout.processarPedido(carrinho, 'cartao-teste');

            // Assert
            expect(pedido).toBeNull();
            expect(repositoryDummy.salvar).not.toHaveBeenCalled();
            expect(emailDummy.enviarEmail).not.toHaveBeenCalled();
        });
    });

    describe('quando um cliente Premium finaliza a compra', () => {
        test('cobra com desconto, salva e envia a confirmação', async () => {
            // Arrange
            const user = UserMother.umUsuarioPremium();
            const carrinho = new CarrinhoBuilder().comUser(user)
                .comItens([new Item('Produto A', 120), new Item('Produto B', 80)]).build();
            const cartao = 'cartao-teste';
            const pedidoSalvo = new Pedido(42, carrinho, 180, 'PROCESSADO');
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };
            const emailMock = { enviarEmail: jest.fn().mockResolvedValue(undefined) };
            const checkout = new CheckoutService(gatewayStub, repositoryStub, emailMock);

            // Act
            const pedido = await checkout.processarPedido(carrinho, cartao);

            // Assert
            expect(carrinho.calcularTotal()).toBe(200);
            expect(gatewayStub.cobrar).toHaveBeenCalledTimes(1);
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, cartao);
            expect(repositoryStub.salvar).toHaveBeenCalledTimes(1);
            expect(repositoryStub.salvar).toHaveBeenCalledWith(new Pedido(null, carrinho, 180, 'PROCESSADO'));
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com', 'Seu Pedido foi Aprovado!', 'Pedido 42 no valor de R$180'
            );
            expect(pedido).toBe(pedidoSalvo);
        });
    });

    test('retorna o pedido salvo com o total integral para cliente padrão', async () => {
        // Arrange
        const carrinho = new CarrinhoBuilder().comItens([new Item('Produto', 200)]).build();
        const pedidoSalvo = new Pedido(7, carrinho, 200, 'PROCESSADO');
        const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
        const repositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };
        const emailDummy = { enviarEmail: jest.fn().mockResolvedValue(undefined) };
        const checkout = new CheckoutService(gatewayStub, repositoryStub, emailDummy);

        // Act
        const pedido = await checkout.processarPedido(carrinho, 'cartao-teste');

        // Assert
        expect(gatewayStub.cobrar).toHaveBeenCalledWith(200, 'cartao-teste');
        expect(repositoryStub.salvar).toHaveBeenCalledWith(new Pedido(null, carrinho, 200, 'PROCESSADO'));
        expect(pedido).toBe(pedidoSalvo);
        expect(pedido.totalFinal).toBe(200);
    });
});
