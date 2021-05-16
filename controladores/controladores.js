const fs = require("fs/promises");

function retornarDataDeEntrega(){
    const hoje = new Date();
    const hojeMaisQuinzeDiasTimesTamp = +hoje + 1000*60*21600;
    const hojeMaisQuinzeDiasDate = new Date(hojeMaisQuinzeDiasTimesTamp);
    carrinhoDeCompras.dataDeEntrega = hojeMaisQuinzeDiasDate;
} 

async function retornarListaDeProdutos(req, res){
    const produtosJson = fs.readFile("./data.json");
    const categoria = req.query.categoria;
    const precoInicial = Number(req.query.precoInicial/100);
    const precoFinal = Number(req.query.precoFinal/100);

    produtosJson.then( produto =>{
        const listaJson = produto;
        const listaDeProdutos = JSON.parse(listaJson);

        if(categoria && !precoInicial && !precoFinal){
            const consultarPorCategoria = listaDeProdutos.produtos.filter(produto => produto.categoria === categoria);
            res.json(consultarPorCategoria);
        }else if(precoInicial && precoFinal && !categoria){
            const consultarPorPreco = listaDeProdutos.produtos.filter(produto => produto.preco >= precoInicial && produto.preco <= precoFinal)
            res.json(consultarPorPreco);
        }else if(precoInicial && precoFinal && categoria){
            const consultaPorPrecoECategoria = listaDeProdutos.produtos.filter(produto => 
            produto.preco >=precoInicial && produto.preco <= precoFinal && produto.categoria === categoria);
            res.json(consultaPorPrecoECategoria);
        }else{
            res.json(listaDeProdutos.produtos)
        }
    });

}

function retornarCarrinho(req, res){

    const carrinhoJson = fs.readFile("./dados/carrinho.json");

    carrinhoJson.then(carrinho =>{
        carrinhoDeCompras = JSON.parse(carrinho);
        if(carrinhoDeCompras.produtos.length === 0){
            res.json({
                produtos: [],
                subTotal: 0,
                dataDeEntrega: "", //requisicao feita em 21/05/2021
                valorDoFrete: 0, // porque a compra é menor que 20000
                totalAPagar: 0,
            })
            
        }else{
            res.json(JSON.parse(carrinho));
        }
            
    })
    
}

function adicionarProdutoAoCarrinho(req, res){
    const id = req.body.id;
    const quantidade = req.body.quantidade;
    let novoProduto = {};

    if(id && quantidade){
        const produtosJson = fs.readFile("./data.json");
        
        produtosJson.then(produto =>{
            const listaDeProdutos = JSON.parse(produto);
            const produtoASerAdicionado = listaDeProdutos.produtos.find(produto => produto.id === id);
            if(produtoASerAdicionado.estoque > 0 && quantidade <= produtoASerAdicionado.estoque){
                novoProduto = {
                    id:id,
                    quantidade:quantidade,
                    nome:produtoASerAdicionado.nome,
                    preco:produtoASerAdicionado.preco,
                    categoria:produtoASerAdicionado.categoria,
                }
                console.log(novoProduto);
                const carrinhoJson = fs.readFile("./dados/carrinho.json");

                carrinhoJson.then(carrinho =>{
                    carrinhoDeCompras = JSON.parse(carrinho);

                    const contem = carrinhoDeCompras.produtos.find(produto => produto.id === id);

                    console.log(contem);

                    if(contem){
                        res.json("Este item já está no carrinho!")
                    }else{
                        carrinhoDeCompras.produtos.push(novoProduto);
                    }

                    //Soma os valores de todos os produtos nocarrinho e atribue ao sub-total
                    let valorTotalDosProdutos = 0;
                    for(let produto of carrinhoDeCompras.produtos){
                        valorTotalDosProdutos += produto.preco * produto.quantidade
                        
                    }
                    carrinhoDeCompras.subTotal = valorTotalDosProdutos;

                    //Atribue data de entrega
                    retornarDataDeEntrega();
                    

                    //Verifica se o valortotal dos produtos é maior que 200,00 e detrmina se haverá ou não cobrança do frete
                    if(carrinhoDeCompras.subTotal/100 <= 20000/100){
                        carrinhoDeCompras.valorDoFrete = 5000/100;
                    }

                    //Soma o sub-total ao valor do frete e retorna o total a pagar
                    carrinhoDeCompras.totalAPagar = carrinhoDeCompras.subTotal + carrinhoDeCompras.valorDoFrete;

                    fs.writeFile("./dados/carrinho.json", JSON.stringify(carrinhoDeCompras));
                    
                     res.json(carrinhoDeCompras);
                    });

                fs.writeFile("./data.json",JSON.stringify(listaDeProdutos), ()=> console.log("writed!"));

                
            }else if(quantidade > produtoASerAdicionado.estoque){
                res.status(404);
                res.json({erro:"A quantidade de produtos é maior que a disponível em estoque"});
            }

            
        })
    }
}

function alterarProdutos(req ,res){

    const id = Number(req.params.idProduto);
    const quantidade = req.body.quantidade;
    console.log(id,quantidade);

    const carrinhoJson = fs.readFile("./dados/carrinho.json");

    carrinhoJson.then(carrinho =>{
        const carrinhoDeCompras = JSON.parse(carrinho);

        if(carrinhoDeCompras.produtos.length === 0){
            res.json({erro:"O carrinho está vazio"})
        }
            

        const produtosJson = fs.readFile("./data.json");

        produtosJson.then(produto => {
            const listaDeProdutos = JSON.parse(produto);
            const produtoAlterado = carrinhoDeCompras.produtos.find(produto => produto.id === id);
            const referenciaEmEstoque = listaDeProdutos.produtos.find(produto => produto.id === id); 
            console.log(referenciaEmEstoque);

            if(!produtoAlterado){
                res.json({erro:`Não existe um produto de id:${id} no carrinho.`});

            }else if(quantidade + produtoAlterado.quantidade > referenciaEmEstoque.estoque || quantidade + produtoAlterado.quantidade < 1){
                res.json({
                    erro:"Erro na quantidade de produtos!",
                    mensagen:"a quantidade final deve  obecer tanto ao estoque quanto ao carrinho ",
                    estoque:`${referenciaEmEstoque.estoque}`,
                    carrinho:`${produtoAlterado.quantidade}`}
                    );
            }else{
                if(quantidade > 0){
                    produtoAlterado.quantidade += quantidade;
                    
                }else{
                    produtoAlterado.quantidade += quantidade;
                }

                //Soma os valores de todos os produtos nocarrinho e atribue ao sub-total
                let valorTotalDosProdutos = 0;
                for(let produto of carrinhoDeCompras.produtos){
                    valorTotalDosProdutos += produto.preco * produto.quantidade
                    
                }
                carrinhoDeCompras.subTotal = valorTotalDosProdutos;

                //Atribue data de entrega 
                carrinhoDeCompras.dataDeEntrega = new Date();

                //Verifica se o valortotal dos produtos é maior que 200,00 e detrmina se haverá ou não cobrança do frete
                if(carrinhoDeCompras.subTotal/100 <= 20000/100){
                    carrinhoDeCompras.valorDoFrete = 5000/100;
                }

                //Soma o sub-total ao valor do frete e retorna o total a pagar
                carrinhoDeCompras.totalAPagar = carrinhoDeCompras.subTotal + carrinhoDeCompras.valorDoFrete;

                

                fs.writeFile("./dados/carrinho.json",JSON.stringify(carrinhoDeCompras));
                res.json(carrinhoDeCompras);
               
            }

        })

       
        
    })
    
}

function removerProduto(req, res){
    id = Number(req.params.idProduto);
    const carrinhoJson = fs.readFile("./dados/carrinho.json");

    carrinhoJson.then(carrinho =>{
        const carrinhoDeCompras = JSON.parse(carrinho);
        const produtoRemovido = carrinhoDeCompras.produtos.find(produto => produto.id === id);

        if(!produtoRemovido){
            res.status(404);
            res.json({error:`Produto não encontrado, não existe nenhum produto de id:${id}`});
        }else{
            const indice = carrinhoDeCompras.produtos.indexOf(produtoRemovido);
            carrinhoDeCompras.produtos.splice(indice,1);
            

            //Subtrair valor do produto removido
            carrinhoDeCompras.subTotal = carrinhoDeCompras.subTotal - produtoRemovido.preco * produtoRemovido.quantidade;

            //data de entrega
            carrinhoDeCompras.dataDeEntrega = new Date();

            //valor do frete
            if(carrinhoDeCompras.subTotal/100 <= 20000/100){
                if(carrinhoDeCompras.produtos.length === 0){
                    carrinhoDeCompras.valorDoFrete = 0
                }else{
                    carrinhoDeCompras.valorDoFrete = 5000/100;
                }

                
            };
            
            //valor do total a pagar
            carrinhoDeCompras.totalAPagar = carrinhoDeCompras.subTotal + carrinhoDeCompras.valorDoFrete;


            res.json(carrinhoDeCompras);
            fs.writeFile("./dados/carrinho.json", JSON.stringify(carrinhoDeCompras));
            console.log(carrinhoDeCompras.produtos.length);
        }

        
    })
}

function removerCarrinho(req, res){
    const carrinhoJson = fs.readFile("./dados/carrinho.json");

    carrinhoJson.then(carrinho =>{
        const carrinhoDecompras = JSON.parse(carrinho);
        carrinhoDecompras.subTotal = 0;
        carrinhoDecompras.dataDeEntrega = "";
        carrinhoDecompras.valorDoFrete = 0;
        carrinhoDecompras.totalAPagar = 0;
        carrinhoDecompras.produtos = [];


        res.send("Operação realizada com sucesso!");
        fs.writeFile("./dados/carrinho.json", JSON.stringify(carrinhoDecompras));
    })
    
}

function finalizarCompra(req, res){

    const tipo = req.body.type;
    const pais = req.body.country;
    const nome = req.body.name;
    const documentos = req.body.documents;

    const carrinhoJson = fs.readFile("./dados/carrinho.json");

    carrinhoJson.then(carrinho =>{
        const carrinhoDeCompras = JSON.parse(carrinho);
        if(carrinhoDeCompras.produtos.length === 0){
            res.status(404);
            res.json({erro:"Carrinho vazio, favor adicionar produtos."}) 
        }

        const produtosJson = fs.readFile("./data.json");

        produtosJson.then(produtos =>{
            const listaDeProdutos = JSON.parse(produtos);

            const osProdutosEstaoDisponiveis = carrinhoDeCompras.produtos.every(items =>{
                const referenciaEmEstoque = listaDeProdutos.produtos.find(produto => produto.id === items.id);
                return (items.quantidade <= referenciaEmEstoque.estoque);
            });

            if(!osProdutosEstaoDisponiveis){
               res.json({erro:"desculpe! falta no estoque, revise a quantidade de items"}); 
            }

            if(tipo && pais && nome && documentos){
                const tipoValido = tipo == "individual";
                const paisValido = pais.length == 2;
                const nomeValido = nome.trim().split(" ").length >= 2;
                const documentoTipoValido = documentos[0].type === "cpf";
                const documentoNumberValido = documentos[0].number.split("").every(number => 9 >= number && number >= 0) && documentos[0].number.length === 11;
                
                if(tipoValido && paisValido && nomeValido && documentoTipoValido && documentoNumberValido){
                    for(let item of carrinhoDeCompras.produtos){
                        referencia = listaDeProdutos.produtos.find(produto => produto.id === item.id);
                        referencia.estoque -= item.quantidade;
                    }

                    fs.writeFile("./data.json", JSON.stringify(listaDeProdutos));
                    
                    res.json(
                        {
                            message:"compra realizada com sucesso!",
                            carrinhoDeCompras
                        }
                        );

                    carrinhoDeCompras.subTotal = 0;
                    carrinhoDeCompras.dataDeEntrega = "";
                    carrinhoDeCompras.valorDoFrete = 0;
                    carrinhoDeCompras.totalAPagar = 0;
                    carrinhoDeCompras.produtos = [];

                    fs.writeFile("./dados/carrinho.json", JSON.stringify(carrinhoDeCompras));

                    
                }else{
                    res.json({erro: "Por favor verifique se os dados estão preenchidos corretamente."})
                }
            }else{
                res.json({erro: "Por favor verifique se todos os dados foram preenchidos."})
            }
            
            
        });
    
    })
}

module.exports= {
    retornarListaDeProdutos, 
    retornarCarrinho, 
    adicionarProdutoAoCarrinho,
    alterarProdutos,
    removerProduto,
    removerCarrinho, 
    finalizarCompra};