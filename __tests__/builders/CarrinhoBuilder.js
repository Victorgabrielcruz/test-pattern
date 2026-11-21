import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { User } from '../../src/domain/User.js';
import { UserMother } from './UserMother.js';

export class CarrinhoBuilder {
    constructor() {
        this.user = UserMother.umUsuarioPadrao();
        this.itens = [new Item('Produto padrão', 100)];
    }

    comUser(user) {
        this.user = new User(user.id, user.nome, user.email, user.tipo);
        return this;
    }

    comItens(itens) {
        this.itens = itens.map((item) => new Item(item.nome, item.preco));
        return this;
    }

    vazio() {
        this.itens = [];
        return this;
    }

    build() {
        const { id, nome, email, tipo } = this.user;
        const user = new User(id, nome, email, tipo);
        const itens = this.itens.map((item) => new Item(item.nome, item.preco));
        return new Carrinho(user, itens);
    }
}
