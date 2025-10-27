// ===== CONFIGURAÇÃO INICIAL =====
// Chave API OMDb (filmes)
const CHAVE_API = "76ae7489";
const URL_BASE = "https://www.omdbapi.com/";

// Chave API TMDb (atores)
const CHAVE_TMDB = "5c5eef5bb57ab5058c5fe547e88ef5ca";

// ===== CONEXÃO COM O HTML =====
const campoBusca = document.getElementById("campo-busca");
const listaResultados = document.getElementById("lista-resultados");
const mensagemStatus = document.getElementById("mensagem-status");

// ===== VARIÁVEIS DE CONTROLE =====
let termoBusca = "";
let paginaAtual = 1;
let totalPaginas = 1;
let tipoBuscaAtual = "filme";

// ===== EVENTO DO BOTÃO BUSCAR =====
document.getElementById("botao-buscar").addEventListener("click", () => {
  termoBusca = campoBusca.value.trim();
  tipoBuscaAtual = document.getElementById("tipo-busca").value;
  paginaAtual = 1;

  if (!termoBusca) {
    mensagemStatus.textContent = "Digite um termo para pesquisar.";
    limparCatalogo();
    return;
  }

  if (tipoBuscaAtual === "filme") {
    pesquisarFilmes();
  } else if (tipoBuscaAtual === "ator") {
    buscarFilmesPorAtor(termoBusca, paginaAtual);
  }
});

// ===== FUNÇÃO DE BUSCA POR FILMES (OMDb) =====
async function pesquisarFilmes() {
  limparCatalogo();

  if (!termoBusca) {
    mensagemStatus.textContent = "Digite o nome de um filme para pesquisar.";
    return;
  }

  mensagemStatus.textContent = "🔄 Buscando filmes, aguarde...";

  try {
    const url = `${URL_BASE}?apikey=${CHAVE_API}&s=${encodeURIComponent(termoBusca)}&page=${paginaAtual}`;
    const resposta = await fetch(url);
    const dados = await resposta.json();

    if (dados.Response === "False") {
      mensagemStatus.textContent = "Nenhum resultado encontrado.";
      return;
    }

    exibirFilmes(dados.Search);
    totalPaginas = Math.ceil(dados.totalResults / 10);
    mensagemStatus.textContent = `Página ${paginaAtual} de ${totalPaginas} — resultados para "${termoBusca}"`;

  } catch (erro) {
    console.error(erro);
    mensagemStatus.textContent = "❌ Erro ao buscar dados. Verifique sua conexão.";
  }
}

// ===== FUNÇÃO PARA EXIBIR FILMES (OMDb) =====
function exibirFilmes(filmes) {
  filmes.forEach(filme => {
    const div = document.createElement("div");
    div.classList.add("card");

    const poster = filme.Poster !== "N/A"
      ? filme.Poster
      : "https://via.placeholder.com/300x450?text=Sem+Poster";

    div.innerHTML = `
      <img src="${poster}" alt="Pôster do filme ${filme.Title}">
      <h3>${filme.Title}</h3>
      <p>Ano: ${filme.Year}</p>
    `;

    listaResultados.appendChild(div);
  });
}

// ===== FUNÇÃO DE BUSCA POR ATORES (TMDb) =====
async function buscarFilmesPorAtor(nomeAtor, pagina = 1) {
  try {
    limparCatalogo();
    mensagemStatus.textContent = "🔎 Buscando ator...";

    if (!nomeAtor) {
      mensagemStatus.textContent = "Digite o nome de um ator para pesquisar.";
      return;
    }

    // Buscar ID do ator
    const respostaAtor = await fetch(
      `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(nomeAtor)}&api_key=${CHAVE_TMDB}&language=pt-BR`
    );
    const dadosAtor = await respostaAtor.json();

    if (!dadosAtor.results || dadosAtor.results.length === 0) {
      exibirMensagem("Nenhum ator encontrado com esse nome.");
      return;
    }

    const ator = dadosAtor.results[0];
    const idAtor = ator.id;

    // Buscar filmes do ator
    mensagemStatus.textContent = `🔎 Buscando filmes de ${ator.name}...`;
    const respostaFilmes = await fetch(
      `https://api.themoviedb.org/3/person/${idAtor}/movie_credits?api_key=${CHAVE_TMDB}&language=pt-BR`
    );
    const dadosFilmes = await respostaFilmes.json();

    if (!dadosFilmes.cast || dadosFilmes.cast.length === 0) {
      exibirMensagem("Nenhum filme encontrado para esse ator.");
      return;
    }

    // Filtrar apenas filmes onde ele atuou
    const filmesAtuados = dadosFilmes.cast.filter(filme =>
      filme.character &&
      filme.character.toLowerCase() !== "self" &&
      filme.character.toLowerCase() !== "archive footage"
    );

    if (filmesAtuados.length === 0) {
      exibirMensagem("Nenhum filme encontrado onde o ator realmente atuou.");
      return;
    }

    // ===== PAGINAÇÃO MANUAL (IGUAL À OMDb) =====
    const filmesPorPagina = 10;
    totalPaginas = Math.ceil(filmesAtuados.length / filmesPorPagina);
    const inicio = (pagina - 1) * filmesPorPagina;
    const fim = inicio + filmesPorPagina;
    const filmesPagina = filmesAtuados.slice(inicio, fim);

    filmesPagina.forEach(filme => {
      const div = document.createElement("div");
      div.classList.add("card");

      const imagem = filme.poster_path
        ? `https://image.tmdb.org/t/p/w300${filme.poster_path}`
        : "https://via.placeholder.com/300x450?text=Sem+Imagem";

      div.innerHTML = `
        <img src="${imagem}" alt="${filme.title || filme.name}">
        <h3>${filme.title || filme.name}</h3>
        <p>Ano: ${filme.release_date ? filme.release_date.split("-")[0] : "N/A"}</p>
        <p>Personagem: ${filme.character}</p>
      `;

      listaResultados.appendChild(div);
    });

    mensagemStatus.textContent = `Página ${pagina} de ${totalPaginas} — filmes atuados por "${ator.name}"`;

  } catch (erro) {
    console.error("Erro ao buscar filmes por ator:", erro);
    exibirMensagem("Erro ao buscar filmes. Tente novamente mais tarde.");
  }
}

// ===== FUNÇÕES AUXILIARES =====
function limparCatalogo() {
  if (listaResultados) listaResultados.innerHTML = "";
}

function exibirMensagem(msg) {
  if (listaResultados) listaResultados.innerHTML = `<p>${msg}</p>`;
  if (mensagemStatus) mensagemStatus.textContent = msg;
}

// ===== FUNÇÕES DE PAGINAÇÃO (PADRÃO UNIFICADO) =====
function proximaPagina() {
  if (paginaAtual < totalPaginas) {
    paginaAtual++;
    if (tipoBuscaAtual === "filme") {
      pesquisarFilmes();
    } else if (tipoBuscaAtual === "ator") {
      buscarFilmesPorAtor(termoBusca, paginaAtual);
    }
  }
}

function paginaAnterior() {
  if (paginaAtual > 1) {
    paginaAtual--;
    if (tipoBuscaAtual === "filme") {
      pesquisarFilmes();
    } else if (tipoBuscaAtual === "ator") {
      buscarFilmesPorAtor(termoBusca, paginaAtual);
    }
  }
}
