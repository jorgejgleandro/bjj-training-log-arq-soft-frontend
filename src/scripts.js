const OpenAI_HOST=`https://api.openai.com/v1/chat/completions`
const OpenAI_API_KEY=''
const Youtube_API_KEY=''

const loader = document.getElementById("loader");

/*
  --------------------------------------------------------------------------------------
  COMPONENTE EXTERNO - OPENAI
  Função genérica para obter um prompt para a descrição do termo dado
  --------------------------------------------------------------------------------------
*/

const getPrompt = (termDescribe) => {
  
  const prompt = `Descreva a posição do Brazilian Jiu-Jitsu denominada ${termDescribe}. A descrição deve ser subdividida em: Princípio:, Posição Inicial: (e.g Guarda, Raspagem, Montada), Execução: (passos numerados), Variações:, Dicas Importantes: e Lembre-se:`
  
  console.log(`in getPrompt: ${prompt}`);

  return prompt;
}

/*
  --------------------------------------------------------------------------------------
  COMPONENTE EXTERNO - OPENAI
  Função genérica para obter texto gerado por um LLM via requisição GET, usando a API da OpenAI, dado um prompt
  --------------------------------------------------------------------------------------
*/

const generateText = async (prompt) => {
  const url = OpenAI_HOST;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OpenAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{role: "user", content: `${prompt}`}],
      temperature: 0.7,
      max_tokens: 4000,
      n: 1,
      stop: null,
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    console.log(`data: ${data}`);
    return data
  } catch (error) {
    console.error('Error:', error);
  }
}

/*
  --------------------------------------------------------------------------------------
  COMPONENTE EXTERNO YOUTUBE
  Função genérica para obter lista de videos via requisição GET, usando a API do Youtube, dado um termo
  --------------------------------------------------------------------------------------
*/

const fetchVideos = async (query, maxResults) => {
  const terms = `${query}+brazilian+jiu-jitsu+bjj`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${terms}&key=${Youtube_API_KEY}&maxResults=${maxResults}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(`Video data: ${JSON.stringify(data)}`);
  return data;
}

/*
  --------------------------------------------------------------------------------------
  COMPONENTE EXTERNO VIACEP
  Função genérica para obter endereço como string via requisição GET, usando a API do ViaCEP, dado um número de CEP
  --------------------------------------------------------------------------------------
*/

const getCEP = async (cep) => {
  try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      return data;

  } catch (error) {
      console.error('Error:', error);
  }
}

/*
  --------------------------------------------------------------------------------------
  Função genérica para obter uma lista existente do servidor via requisição GET
  --------------------------------------------------------------------------------------
*/
const getList = async (route_name, myTable) => {
  let url = 'http://127.0.0.1:5000/' + route_name;
  fetch(url, {
    method: 'get',
  })
    .then((response) => response.json())
    .then((data) => {
      data[route_name].forEach(item => insertList(item, myTable, route_name))
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

/*
  --------------------------------------------------------------------------------------
  Chamada de funções genéricas para carregamento inicial dos dados e geração da lista
  --------------------------------------------------------------------------------------
*/
getList('tecnicas', 'myTableTecnica');

getList('alunos', 'myTableAlunos');


/*
  --------------------------------------------------------------------------------------
  Função genérica para colocar um item numa lista do servidor via requisição POST
  --------------------------------------------------------------------------------------
*/

const postItem = async (item_obj, route_name, myTable) => {

  item_keys = Object.keys(item_obj);
  item_values = Object.values(item_obj);

  const formData = new FormData();

  for (let [key, value] of Object.entries(item_obj)) {
    console.log(`key: ${key} value: ${value}`);
    formData.append(key, value);
  }

  let url = 'http://127.0.0.1:5000/' + route_name;
  fetch(url, {
    method: 'post',
    body: formData
  })
    .then((response) => {
      if (response.status === 200) {
        insertList(item_obj, myTable, route_name);
        alert("Tecnica adicionada!");
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}


/*
  --------------------------------------------------------------------------------------
  Função para criar um botão close para cada item da lista
  --------------------------------------------------------------------------------------
*/
const insertButton = (parent, route_name) => {
  let span = document.createElement("span");
  let txt = document.createTextNode("\u00D7");
  span.className = `close_${route_name}`;
  span.appendChild(txt);
  parent.appendChild(span);
}


/*
  --------------------------------------------------------------------------------------
  Função genérica para remover um item de uma lista de acordo com o click no botão close
  --------------------------------------------------------------------------------------
*/
const removeElement = (route_name) => {
  let close = document.getElementsByClassName(`close_${route_name}`);
  let i;

  for (i = 0; i < close.length; i++) {
    close[i].onclick = function () {
      let div = this.parentElement.parentElement;
      const nomeItem = div.getElementsByTagName('td')[0].innerHTML
      if (confirm("Você tem certeza?")) {
        div.remove()
        deleteItem(route_name, nomeItem)
        alert("Removido!")
      }
    }
  }
}

/*
  --------------------------------------------------------------------------------------
  Função genérica para remover um item de uma lista do servidor via requisição DELETE
  --------------------------------------------------------------------------------------
*/
const deleteItem = (route_name, item) => {
  console.log(item)

  let url = 'http://127.0.0.1:5000/' + route_name + '?nome=' + item;
  fetch(url, {
    method: 'delete'
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error('Error:', error);
    });
}

/*
  --------------------------------------------------------------------------------------
  Função para obter o valor do Nivel selecionado pelo usuario dentre os botões de Radio
  --------------------------------------------------------------------------------------
*/
const getNivelValue = (newNivel) => {
  var radio_btns = document.getElementsByName(newNivel), i;
  for (i = 0; i < radio_btns.length; i++)
    if (radio_btns[i].checked)
      return radio_btns[i].value;
  return null;
}

/*
  --------------------------------------------------------------------------------------
  Função para construir e devolver um objeto a partir dos valores fornecidos pelo usuário no form do frontend,
  para uma determinada rota
  --------------------------------------------------------------------------------------
*/
const getItemObj = async (route_name, ...args) => {
  if (route_name === 'tecnica') {
    const termDescribe = document.getElementById(args[0]).value;
    console.log(`termDescribe: ${termDescribe}`);
    let inputDescription = document.getElementById(args[1]);
        
    const prompt = getPrompt(termDescribe);
    console.log(`in getItemObj prompt: ${prompt}`);
     
    loader.style.display = "block";
    const descriptionData = await generateText(prompt);
    loader.style.display = "none";

    console.log(`generated data in getItemObj: ${descriptionData.choices[0]["message"]["content"]}`);

    inputDescription.value = descriptionData.choices[0]["message"]["content"]

    console.log(`inputDescription: ${inputDescription.value}`)

    let inputVideo = document.getElementById(args[3]);
    loader.style.display = "block";
    const videosData = await fetchVideos(termDescribe, 1);
    loader.style.display = "none";

    const videoLink = `https://www.youtube.com/watch?v=` + videosData["items"][0]["id"]["videoId"];

    inputVideo.value = videoLink;

    return ({
      'nome': document.getElementById(args[0]).value,
      'descricao': document.getElementById(args[1]).value,
      'nivel': getNivelValue(args[2]),
      'video': document.getElementById(args[3]).value
    });
  } else if (route_name === 'aluno') {

    let inputEndereco = document.getElementById(args[4])

    const proxyEndereco = document.getElementById(args[4]).value;
    loader.style.display = "block";
    const enderecoData = await getCEP(proxyEndereco);
    loader.style.display = "none";

    const enderecoStr = `${enderecoData.logradouro}, ${enderecoData.bairro}, ${enderecoData.localidade}, ${enderecoData.uf}`;

    inputEndereco.value = enderecoStr;

    return ({
      'nome': document.getElementById(args[0]).value,
      'data_de_nascimento': document.getElementById(args[1]).value,
      'data_de_inicio': document.getElementById(args[2]).value,
      'graduacao': document.getElementById(args[3]).value,
      'endereco': document.getElementById(args[4]).value
    });

  } else {
    console.log('Unknown item type!')
  }
}


/*
  --------------------------------------------------------------------------------------
  Função genérica para adicionar um novo item em uma tabela especifica, conforme rota
  --------------------------------------------------------------------------------------
*/
const newItem = async (route_name, myTable, ...args) => {
  console.log(`In newItem. route_name: ${route_name} myTable:${myTable} args:${args}`)

  const item_obj = await getItemObj(route_name, ...args);

  console.log(`In newItem. item_obj: ${JSON.stringify(item_obj)}`)

  if (args[0] === '') {
    alert("Escreva o nome da entrada!");
  } else {

    postItem(item_obj, route_name, myTable)
  }
}

/*
  ----------------------------------------------------------------------------------------------
  Função genérica para limpar campos de entrada no formulário referente a uma tabela especifica
  ----------------------------------------------------------------------------------------------
*/
const clearInputFields = (myTable) => {

  console.log(`myTable: ${myTable}`)

  if (myTable === 'myTableTecnica') {
    document.getElementById("newTecnica").value = "";
    document.getElementById("newDescricao").value = "";
    document.getElementsByName("newNivel")[0].checked = true;
    document.getElementById("newVideo").value = "";
  } else if (myTable === 'myTableAluno') {
    document.getElementById("newAluno").value = "";
    document.getElementById("newDataNascimento").value = "";
    document.getElementById("newDataInicio").value = "";
    document.getElementById("newGraduacao").value = "";
    document.getElementById("newEndereco").value = "";

  } else {
    console.log('Unknown item type');
  }

}


/*
  --------------------------------------------------------------------------------------
  Função genérica para inserir itens na lista específica apresentada
  --------------------------------------------------------------------------------------
*/
const insertList = (item_obj, myTable, route_name) => {
  let item = Object.values(item_obj);
  let key = Object.keys(item_obj);

  let table = document.getElementById(myTable);
  let row = table.insertRow();

  for (let i = 0; i < item.length; i++) {
    let cel = row.insertCell(i);

    console.log(`INSERTLIST -- key is ${key[i]} value is ${item[i]}`)

    if (key[i] === 'video'){
      console.log(`creating link for ${item[i]}`)
      const link = document.createElement('a');
      link.href = item[i];
      link.target = '_blank';
      link.innerText = item[i];
      cel.appendChild(link);
    }
    else{
      cel.textContent = item[i];
    }
  }

  insertButton(row.insertCell(-1), route_name);

  clearInputFields(myTable);

  removeElement(route_name);
}


/*
  --------------------------------------------------------------------------------------
  Função para selecionar aba ativa no frontend da aplicação
  --------------------------------------------------------------------------------------
*/
const setTab = (tab_content, tab_button) => {

  const tabcontents = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontents.length; i++) {
    tabcontents[i].style.display = "none";
  }

  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }


  tab_content.style.display = "block";
  tab_button.classList.add("active");

}



/*
  --------------------------------------------------------------------------------------
  Associando escutadores para o evento de click sobre o botão associado a cada aba
  --------------------------------------------------------------------------------------
*/

const newTecnicaTab = document.getElementById("newTecnica_tab");
const newTecnicaContent = document.getElementById("newTecnica_content");

const newAlunoTab = document.getElementById("newAluno_tab");
const newAlunoContent = document.getElementById("newAluno_content");


newTecnicaTab.addEventListener("click", () => {
  setTab(newTecnicaContent, newTecnicaTab);
});

newAlunoTab.addEventListener("click", () => {
  setTab(newAlunoContent, newAlunoTab);
});

newTecnicaTab.click();