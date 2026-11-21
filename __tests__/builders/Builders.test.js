import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { User } from '../../src/domain/User.js';
import { CarrinhoBuilder } from './CarrinhoBuilder.js';
import { UserMother } from './UserMother.js';

test('Object Mother fornece usuários reais, previsíveis e independentes', () => {
    const padrao = UserMother.umUsuarioPadrao();
    const premium = UserMother.umUsuarioPremium();
    expect(padrao).toBeInstanceOf(User);
    expect(padrao.isPremium()).toBe(false);
    expect(premium).toBeInstanceOf(User);
    expect(premium.isPremium()).toBe(true);
    expect(premium.email).toBe('premium@email.com');
    expect(UserMother.umUsuarioPadrao()).not.toBe(padrao);
});

test('Builder cria carrinhos padrão, vazios e configuráveis com API fluente', () => {
    const builder = new CarrinhoBuilder();
    expect(builder.build()).toBeInstanceOf(Carrinho);
    expect(builder.build().calcularTotal()).toBe(100);
    expect(builder.vazio()).toBe(builder);
    expect(builder.build().calcularTotal()).toBe(0);
    const user = UserMother.umUsuarioPremium();
    expect(builder.comUser(user)).toBe(builder);
    expect(builder.comItens([new Item('A', 120), new Item('B', 80)])).toBe(builder);
    const carrinho = builder.build();
    expect(carrinho.user).toBeInstanceOf(User);
    expect(carrinho.user).toEqual(user);
    expect(carrinho.calcularTotal()).toBe(200);
});

test('usuários não são compartilhados com a entrada nem entre construções', () => {
    // Arrange
    const user = UserMother.umUsuarioPremium();
    const builder = new CarrinhoBuilder().comUser(user);
    const builderPadrao = new CarrinhoBuilder();
    const primeiro = builder.build();

    // Act
    user.email = 'alterado@email.com';
    primeiro.user.tipo = 'PADRAO';
    builderPadrao.build().user.tipo = 'PREMIUM';
    const segundo = builder.build();

    // Assert
    expect(primeiro.user.email).toBe('premium@email.com');
    expect(segundo.user.email).toBe('premium@email.com');
    expect(segundo.user.isPremium()).toBe(true);
    expect(builderPadrao.build().user.isPremium()).toBe(false);
});

test('itens não são compartilhados com a entrada, outras construções ou builders', () => {
    const itens = [new Item('A', 50)];
    const builder = new CarrinhoBuilder().comItens(itens);
    itens[0].preco = 999;
    itens.push(new Item('B', 10));
    const primeiro = builder.build();
    primeiro.itens[0].preco = 1;
    primeiro.itens.push(new Item('C', 1));
    expect(builder.build().calcularTotal()).toBe(50);
    expect(new CarrinhoBuilder().build().calcularTotal()).toBe(100);
});
