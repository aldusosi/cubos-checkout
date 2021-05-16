const express = require("express");
const controlador = require("./controladores/controladores");

const rotas = express();

rotas.get("/produtos", controlador.retornarListaDeProdutos );
rotas.get("/carrinho", controlador.retornarCarrinho);
rotas.post("/carrinho/produtos", controlador.adicionarProdutoAoCarrinho);
rotas.patch("/carrinho/produtos/:idProduto", controlador.alterarProdutos);
rotas.delete("/carrinho/produtos/:idProduto", controlador.removerProduto);
rotas.delete("/carrinho", controlador.removerCarrinho);
rotas.post("/finalizar-compra", controlador.finalizarCompra);

module.exports = rotas;