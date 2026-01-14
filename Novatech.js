function showSection(sectionId, el) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  document.getElementById("pageTitle").innerText =
    sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active-nav'));
  if (el) el.classList.add('active-nav');
}

let products = JSON.parse(localStorage.getItem("products")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) || [];
let editIndex = null;

const productForm = document.getElementById("productForm");
const productList = document.getElementById("productList");
const searchInput = document.getElementById("searchInput");
const categoryForm = document.getElementById("categoryForm");
const categoryList = document.getElementById("categoryList");
const apiProductList = document.getElementById("apiProductList");

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
}



async function loadAPIStore() {
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    const data = await res.json();
    renderAPIProducts(data);
  } catch (err) {
    console.error("API Error:", err);
  }
}

function renderAPIProducts(apiProducts) {
  if (!apiProductList) return;

  apiProductList.innerHTML = "";

  apiProducts.forEach(p => {
    const li = document.createElement("li");

    const btn = document.createElement("button");
    btn.className = "btn-primary";
    btn.textContent = "Import";
    btn.addEventListener("click", () => importProduct(p));

    li.innerHTML = `
      <div style="display:flex; gap:15px; align-items:center;">
        <img src="${p.image}" style="width:60px; height:60px; object-fit:contain; background:#fff; padding:5px; border-radius:8px;">
        <div class="product-info">
          <strong>${p.title}</strong>
          <div>
            <span class="price">$${p.price}</span> • ${p.category}
          </div>
        </div>
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.appendChild(btn);

    li.appendChild(actions);
    apiProductList.appendChild(li);
  });
}


function importProduct(p) {
  let qty = prompt("Enter quantity to import:");
  if (qty === null) return;

  qty = Number(qty);
  if (isNaN(qty) || qty <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }

  const cleanCategory =
    p.category.charAt(0).toUpperCase() + p.category.slice(1).toLowerCase();

  const newProduct = {
    name: p.title,
    price: p.price,
    stock: qty,
    category: cleanCategory
  };

  products.push(newProduct);

  if (!categories.includes(cleanCategory)) {
    categories.push(cleanCategory);
    saveCategories();
  }

  saveProducts();
  renderProducts();
  renderCategories();
  updateDashboard();

  alert("Product imported!");
}





function renderProducts(filtered = products) {
  productList.innerHTML = "";

  filtered.forEach((p, index) => {
    const li = document.createElement("li");

    let stockClass = p.stock <= 3 ? "stock-low" : "stock-ok";
    let stockText = p.stock <= 3 ? "Low Stock" : "In Stock";

    li.innerHTML = `
      <div class="product-info">
        <strong>${p.name}</strong>
        <div>
          <span class="price">$${p.price}</span>
          • <span class="stock-badge ${stockClass}">${stockText}</span>
          • ${p.category}
        </div>
      </div>

      <div class="actions">
        <button class="action-btn" onclick="editProduct(${index})">✎</button>
        <button class="action-btn action-delete" onclick="confirmDelete(${index})">⌫</button>
      </div>
    `;

    productList.appendChild(li);
  });
}

function deleteProduct(index) {
  products.splice(index, 1);
  saveProducts();
  renderProducts();
  updateDashboard();
}

function confirmDelete(index) {
  if (confirm("Delete this product?")) {
    deleteProduct(index);
  }
}

function editProduct(index) {
  const p = products[index];
  document.getElementById("name").value = p.name;
  document.getElementById("price").value = p.price;
  document.getElementById("stock").value = p.stock;
  document.getElementById("categorySelect").value = p.category;
  editIndex = index;
}

productForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const stock = document.getElementById("stock").value;
  const category = document.getElementById("categorySelect").value;

  const product = { name, price, stock, category };

  if (editIndex === null) {
    products.push(product);
  } else {
    products[editIndex] = product;
    editIndex = null;
  }

  saveProducts();
  renderProducts();
  updateDashboard();
  productForm.reset();
});

searchInput.addEventListener("input", function() {
  const value = this.value.toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(value)
  );
  renderProducts(filtered);
});



function renderCategories() {
  categoryList.innerHTML = "";

  const select = document.getElementById("categorySelect");
  const filter = document.getElementById("filterCategory");

  if (select) select.innerHTML = `<option value="">Select category</option>`;
  if (filter) filter.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach((c, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${c}</span>
      <button class="action-btn action-delete" onclick="deleteCategory(${index})">⌫</button>
    `;
    categoryList.appendChild(li);

    if (select) {
      const option = document.createElement("option");
      option.value = c;
      option.textContent = c;
      select.appendChild(option);
    }

    if (filter) {
      const option = document.createElement("option");
      option.value = c;
      option.textContent = c;
      filter.appendChild(option);
    }
  });
}

function deleteCategory(index) {
  if (!confirm("Delete this category and all its products?")) return;

  const removedCategory = categories[index];

 
  categories.splice(index, 1);


  products = products.filter(p => p.category !== removedCategory);

  saveCategories();
  saveProducts();

  renderCategories();
  renderProducts();
  updateDashboard();
}




let stockChart = null;

function updateDashboard() {
  document.getElementById("totalProducts").innerText = products.length;

  let totalStock = 0;
  products.forEach(p => totalStock += Number(p.stock));
  document.getElementById("totalStock").innerText = totalStock;

  document.getElementById("totalCategories").innerText = categories.length;

  updateChart();
}

function updateChart() {
  const canvas = document.getElementById("stockChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const categoryTotals = {};

  products.forEach(p => {
    if (!categoryTotals[p.category]) {
      categoryTotals[p.category] = 0;
    }
    categoryTotals[p.category] += Number(p.stock);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (stockChart) {
    stockChart.destroy();
  }

  stockChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Stock",
        data: data
      }]
    }
  });
}

function filterByCategory() {
  const selected = document.getElementById("filterCategory").value;

  if (selected === "all") {
    renderProducts();
  } else {
    const filtered = products.filter(p => p.category === selected);
    renderProducts(filtered);
  }
}



(async function init() {
  await loadAPIStore();
  renderProducts();
  renderCategories();
  updateDashboard();
})();

let nameAsc = true;
let priceAsc = true;

function sortByName(btn) {
  if (nameAsc) {
    products.sort((a, b) => a.name.localeCompare(b.name));
    btn.innerText = "Z → A";
  } else {
    products.sort((a, b) => b.name.localeCompare(a.name));
    btn.innerText = "A → Z";
  }

  nameAsc = !nameAsc;
  renderProducts();
}

function sortByPrice(btn) {
  if (priceAsc) {
    products.sort((a, b) => a.price - b.price);
    btn.innerText = "Price ↓";
  } else {
    products.sort((a, b) => b.price - a.price);
    btn.innerText = "Price ↑";
  }

  priceAsc = !priceAsc;
  renderProducts();
}


 let stockAsc = true;

function sortByStock(btn) {
  if (stockAsc) {
    products.sort((a, b) => a.stock - b.stock);
    btn.innerText = "Stock ↓";
  } else {
    products.sort((a, b) => b.stock - a.stock);
    btn.innerText = "Stock ↑";
  }

  stockAsc = !stockAsc;
  renderProducts();
}
