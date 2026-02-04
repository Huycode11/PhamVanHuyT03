const API = 'https://api.escuelajs.co/api/v1/products';

// DOM Elements
const tableBody = document.getElementById('tableBody');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const createForm = document.getElementById('createForm');
const editForm = document.getElementById('editForm');
const createModal = document.getElementById('createModal');
const detailModal = document.getElementById('detailModal');

// Create Modal Elements
const createTitle = document.getElementById('createTitle');
const createPrice = document.getElementById('createPrice');
const createDesc = document.getElementById('createDesc');
const createImage = document.getElementById('createImage');
const createCategoryId = document.getElementById('createCategoryId');

// Detail Modal Elements
const detailId = document.getElementById('detailId');
const detailTitle = document.getElementById('detailTitle');
const detailPrice = document.getElementById('detailPrice');
const detailDesc = document.getElementById('detailDesc');
const detailImage = document.getElementById('detailImage');
const detailImageUrl = document.getElementById('detailImageUrl');
let filteredProducts = [];
let currentPage = 1;
let pageSize = 10;
let sortColumn = '';
let sortDirection = 'asc';

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    searchInput.oninput = e => handleSearch(e.target.value);
    pageSizeSelect.onchange = e => {
        pageSize = +e.target.value;
        currentPage = 1;
        render();
    };
    createForm.onsubmit = handleCreate;
    editForm.onsubmit = handleUpdate;
});

async function fetchData() {
    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        allProducts = await res.json();
        filteredProducts = [...allProducts];
        render();
    } catch (err) {
        console.error('Error fetching data:', err);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
}

function render() {
    renderTable();
    renderPagination();
}

function renderTable() {
    tableBody.innerHTML = '';
    const start = (currentPage - 1) * pageSize;
    const pageData = filteredProducts.slice(start, start + pageSize);

    if (!pageData.length) {
        tableBody.innerHTML = `<tr><td colspan="6">Không có dữ liệu</td></tr>`;
        return;
    }

    pageData.forEach(p => {
        let img = '';
        if (p.images && p.images.length > 0) {
            const firstImage = p.images[0];
            img = typeof firstImage === 'string' 
                ? firstImage.replace(/[\[\]"]/g, '').trim()
                : firstImage;
        }
        const tr = document.createElement('tr');
        tr.title = p.description;
        tr.setAttribute('data-bs-toggle', 'tooltip');

        tr.innerHTML = `
            <td>${p.id}</td>
            <td class="fw-bold text-primary">${p.title}</td>
            <td class="fw-bold text-success">$${p.price}</td>
            <td>${p.category?.name || ''}</td>
            <td><img src="${img}" class="product-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2750%27 height=%2750%27%3E%3Crect width=%2750%27 height=%2750%27 fill=%27%23ddd%27/%3E%3C/svg%3E'"></td>
            <td>
                <button class="btn btn-outline-info btn-sm"
                    onclick="openDetail(${p.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>`;
        tableBody.appendChild(tr);
    });

    new bootstrap.Tooltip(document.body, { selector: '[data-bs-toggle]' });
}

function renderPagination() {
    const total = Math.ceil(filteredProducts.length / pageSize);
    pagination.innerHTML = '';

    for (let i = 1; i <= total; i++) {
        pagination.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" onclick="changePage(${i})">${i}</a>
            </li>`;
    }
}

function changePage(p) {
    currentPage = p;
    render();
}

function handleSearch(k) {
    filteredProducts = allProducts.filter(p =>
        p.title.toLowerCase().includes(k.toLowerCase()));
    currentPage = 1;
    render();
}

function handleSort(col) {
    sortDirection = sortColumn === col && sortDirection === 'asc' ? 'desc' : 'asc';
    sortColumn = col;

    filteredProducts.sort((a, b) => {
        let x = a[col], y = b[col];
        if (typeof x === 'string') x = x.toLowerCase();
        if (typeof y === 'string') y = y.toLowerCase();
        return sortDirection === 'asc' ? x > y : x < y;
    });

    document.getElementById('sort-title').innerText = '';
    document.getElementById('sort-price').innerText = '';
    document.getElementById(`sort-${col}`).innerText = sortDirection === 'asc' ? '↑' : '↓';

    render();
}

function exportToCSV() {
    const start = (currentPage - 1) * pageSize;
    const pageData = filteredProducts.slice(start, start + pageSize);
    let csv = "ID,Title,Price,Category,Description\n";

    pageData.forEach(p => {
        csv += `${p.id},"${p.title}",${p.price},"${p.category?.name || ''}","${p.description}"\n`;
    });

    const blob = new Blob([csv]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'products_current_page.csv';
    a.click();
}

function openDetail(id) {
    const p = allProducts.find(x => x.id === id);
    detailId.value = p.id;
    detailTitle.value = p.title;
    detailPrice.value = p.price;
    detailDesc.value = p.description;
    const imageUrl = p.images?.[0] || '';
    detailImage.src = imageUrl;
    detailImageUrl.value = imageUrl;
    new bootstrap.Modal(detailModal).show();
}

async function handleUpdate(e) {
    e.preventDefault();
    try {
        const imageUrl = detailImageUrl.value.trim() || detailImage.src;
        const res = await fetch(`${API}/${detailId.value}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                title: detailTitle.value,
                price: +detailPrice.value,
                description: detailDesc.value,
                images: [imageUrl]
            })
        });
        if (!res.ok) throw new Error(`Cập nhật thất bại: ${res.status}`);
        alert('Cập nhật sản phẩm thành công!');
        detailImageUrl.value = '';
        fetchData();
        bootstrap.Modal.getInstance(detailModal).hide();
    } catch (err) {
        console.error('Update error:', err);
        alert(`Lỗi cập nhật: ${err.message}`);
    }
}

async function handleCreate(e) {
    e.preventDefault();
    
    // Validate required fields
    if (!createTitle.value || !createPrice.value || !createDesc.value || !createImage.value) {
        alert('Vui lòng điền đầy đủ thông tin sản phẩm!');
        return;
    }
    
    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                title: createTitle.value,
                price: parseFloat(createPrice.value),
                description: createDesc.value,
                categoryId: parseInt(createCategoryId.value) || 1,
                images: [createImage.value]
            })
        });
        if (!res.ok) throw new Error(`Tạo thất bại: ${res.status}`);
        const newProduct = await res.json();
        alert(`Thêm sản phẩm "${newProduct.title}" thành công!`);
        createForm.reset();
        fetchData();
        bootstrap.Modal.getInstance(createModal).hide();
    } catch (err) {
        console.error('Create error:', err);
        alert(`Lỗi thêm sản phẩm: ${err.message}`);
    }
}
