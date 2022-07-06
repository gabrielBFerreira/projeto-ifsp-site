const BASE_URL = 'http://127.0.0.1:7777';

async function listCategories() {
  const categories = await fetch(`${BASE_URL}/categories`);
  const { categorias } = await categories.json();

  const menu = document.getElementById('sideMenu');
  categorias.forEach(category => {
    const element = 
    `<a href="#" class="w3-bar-item w3-button" onclick="listProducts(${category.id},'${category.nome}')">${category.nome}</a>`;
    
    menu.insertAdjacentHTML('beforeend', element);
  });  
}

async function listProducts(categoryId,categoryName) {
  const products = await fetch(`${BASE_URL}/products?idCategoria=${categoryId}`);
  const { produtos } = await products.json();

  const title = document.getElementById('categoryTitle');
  if (categoryName) title.innerHTML = categoryName;

  const list = document.getElementById('productList');
  list.innerHTML = '';

  produtos.forEach(product => {
    const element = 
    `<div class="w3-display-container product" id="product${product.id}">
      <img src="${product.figuras[0].caminho}" class="productPhoto">
      <div class="w3-display-middle w3-display-hover">
        <button class="w3-button w3-black" onclick="addToCart(${product.id})">Bota no carrinho <i class="fa fa-shopping-cart"></i></button>
      </div>
      <p class="productName" id="productName">${product.nome}</p>
      <p class="productPrice" id="productPrice"><b>R$ ${product.preco}</b></p>
    </div>`;

    list.insertAdjacentHTML('beforeend', element);
  });
}

const cartItems = [];
let cartTotalPrice = 0;

function addToCart(productId) {
  const element = document.getElementById(`product${productId}`);

  const itemIndex = cartItems.findIndex(item => item.id == productId);

  const priceString = element.querySelector("#productPrice").innerText;
  const price = Number(priceString.split(' ')[1]);

  if (itemIndex >= 0) {
    const item = cartItems[itemIndex];
    item.quantity++;
  } else {
    const cartItem = {
      id: productId,
      name: element.querySelector("#productName").innerText,
      price,
      quantity: 1
    }
  
    cartItems.push(cartItem);
  }

  countTotalPrice();
}

function countTotalPrice() {
  cartTotalPrice = cartItems.reduce((total, element) => {
    return total + (element.price * element.quantity);    
  }, 0);

  console.log(cartTotalPrice);
}

function renderCart() {
  const cart = document.getElementById('cartItems');
  cart.innerHTML = '';

  const header = 
  `<div class="cartItem">
    <div style="display:none"></div>
    <div class="cartItemName">Nome</div>
    <div class="cartItemProperty">Preço</div>
    <div class="cartItemProperty">Quantidade</div>
    <div class="cartItemProperty">Subtotal</div>
    <div class="cartItemProperty">Remover</div>
  </div>`;

  cart.insertAdjacentHTML('beforeend', header);

  cartItems.forEach((item, index) => {
    const element =
    `<div class="cartItem">
      <div style="display:none">${item.id}</div>
      <div class="cartItemName">${item.name}</div>
      <div class="cartItemProperty">R$ ${item.price}</div>
      <div class="cartItemProperty">${item.quantity}</div>
      <div class="cartItemProperty">R$ ${(item.price * item.quantity)}</div>
      <div class="cartItemProperty"><span onclick="deleteCartItem(${index})" class="w3-button">&times;</span></div>
    </div>`;
  
    cart.insertAdjacentHTML('beforeend', element);
  });

  const cartDetails = 
  `<div class="cartDetails" id="cartDetails">
    <span>Total: R$ ${cartTotalPrice}</span>
    <button type="submit">Finalizar compra</button>
  </div>`;

  cart.insertAdjacentHTML('beforeend', cartDetails);
}

function deleteCartItem(index) {
  cartItems.splice(index, 1);

  countTotalPrice();

  renderCart();
}

function finishCart() {
  const payload = {
    precoTotal: cartTotalPrice,
    idFormaPagamento: 1,
    produtos: cartItems.map(item => {
      return {
        idProduto: item.id,
        quantidade: item.quantity
      }
    })
  }

  const token = window.localStorage.getItem('token');

  if(!token) {
    alert('Por favor, faça login antes de confirmar uma compra.');
    return;
  }

  fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8'
    }
  });
}

function openCart() {
  document.getElementById("cart").style.display = "block";
  renderCart();  
}

function closeCart() {
  document.getElementById("cart").style.display = "none";
}

function w3_open() {
  document.getElementById("mySidebar").style.display = "block";
  document.getElementById("myOverlay").style.display = "block";
}

function w3_close() {
  document.getElementById("mySidebar").style.display = "none";
  document.getElementById("myOverlay").style.display = "none";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("clientName");

  window.reload();
}

const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');

const token = window.localStorage.getItem('token');

if (token) {
  const clientName = window.localStorage.getItem('clientName');

  loginForm.innerHTML = `Você não é ${clientName}? <button onclick="logout()">Faça logout.</button>`;
}

loginButton.addEventListener('click', event => {
  event.preventDefault();
  
  const payload = {
    email: loginForm.email.value,
    senha: loginForm.password.value,
  }

  fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    }
  }).then(response => response.json()).then(data => {
    if (data.code === 400 || data.code === 404 || data.code === 500) {
      alert(data.message);
      return;
    }

    alert(`Olá, ${data.usuario.nome}! Sinta-se à vontade!`);

    window.localStorage.setItem('token', data.token);
    window.localStorage.setItem('clientName', data.usuario.nome);

    loginForm.innerHTML = `Você não é ${data.usuario.nome}? <button onclick="logout()">Faça logout.</button>`;
  }).catch(error => console.log(error));
});

listCategories();
listProducts();