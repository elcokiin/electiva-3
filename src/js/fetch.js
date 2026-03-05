
const USERS_URL = "https://jsonplaceholder.typicode.com/users";

const tableBody = document.getElementById("users-table");
const tableStatus = document.getElementById("table-status");
const detailContainer = document.getElementById("detail");
const imageStatus = document.getElementById("image-status");
const blobImageOne = document.getElementById("blob-image-1");
const blobImageTwo = document.getElementById("blob-image-2");

const editableFields = [
  "name",
  "username",
  "email",
  "phone",
  "website",
  "company.name",
  "company.catchPhrase",
  "address.street",
  "address.city",
  "address.zipcode",
];

const getValueByPath = (obj, path) =>
  path.split(".").reduce((acc, key) => (acc ? acc[key] : ""), obj);

const setValueByPath = (obj, path, value) => {
  const parts = path.split(".");
  const last = parts.pop();
  let ref = obj;
  parts.forEach((key) => {
    if (!ref[key]) {
      ref[key] = {};
    }
    ref = ref[key];
  });
  ref[last] = value;
};

const renderTable = (users) => {
  tableBody.innerHTML = "";
  users.forEach((user) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><a href="#" data-user-id="${user.id}">${user.name}</a></td>
      <td>${user.email}</td>
      <td>${user.phone}</td>
      <td>${user.company?.name || ""}</td>
      <td>${user.website}</td>
      <td class="action-cell">
        <button class="action-button" data-action="patch" data-user-id="${user.id}">PATCH</button>
        <button class="action-button danger" data-action="delete" data-user-id="${user.id}">DELETE</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
};

const renderDetail = (user) => {
  detailContainer.innerHTML = "";

  if (!user) {
    detailContainer.innerHTML =
      '<p class="empty-state">No hay usuario seleccionado.</p>';
    return;
  }

  editableFields.forEach((field) => {
    const card = document.createElement("div");
    card.className = "detail-card";

    const label = document.createElement("label");
    label.textContent = field;

    const input = document.createElement("input");
    input.value = getValueByPath(user, field) || "";
    input.addEventListener("input", (event) => {
      setValueByPath(user, field, event.target.value);
      console.log("Dato modificado:", {
        id: user.id,
        field,
        value: event.target.value,
      });
    });

    card.appendChild(label);
    card.appendChild(input);
    detailContainer.appendChild(card);
  });

  const extraFields = [
    { label: "ID", value: user.id },
    { label: "Username", value: user.username },
    { label: "Ciudad", value: user.address?.city },
    { label: "Empresa", value: user.company?.name },
  ];

  extraFields.forEach((item) => {
    const card = document.createElement("div");
    card.className = "detail-card";
    card.innerHTML = `
      <label>${item.label}</label>
      <span>${item.value || ""}</span>
    `;
    detailContainer.appendChild(card);
  });
};

const patchUser = async (user, updates) => {
  try {
    const response = await fetch(`${USERS_URL}/${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`PATCH fallido: ${response.status}`);
    }
    const result = await response.json();
    console.log("PATCH exitoso:", result);
  } catch (error) {
    console.error("Error en PATCH:", error);
  }
};

const deleteUser = async (user) => {
  try {
    const response = await fetch(`${USERS_URL}/${user.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`DELETE fallido: ${response.status}`);
    }
    console.log("DELETE exitoso:", { id: user.id, status: response.status });
  } catch (error) {
    console.error("Error en DELETE:", error);
  }
};

const loadBlobImage = async (path, imgElement, label) => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Imagen ${label} fallo: ${response.status}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    imgElement.src = url;
    imgElement.dataset.blobUrl = url;
  } catch (error) {
    console.error(`Error cargando imagen ${label}:`, error);
    imageStatus.textContent =
      "Ocurrio un error al cargar las imagenes. Revisa la consola.";
  }
};

const loadUsers = async () => {
  tableStatus.textContent = "Cargando usuarios...";
  try {
    const response = await fetch(USERS_URL);
    if (!response.ok) {
      throw new Error(`Respuesta invalida: ${response.status}`);
    }
    const data = await response.json();
    const users = data.slice(0, 30);
    renderTable(users);
    tableStatus.textContent = `Usuarios cargados: ${users.length}`;
    renderDetail(null);

    tableBody.addEventListener("click", (event) => {
      const link = event.target.closest("a[data-user-id]");
      const actionButton = event.target.closest("button[data-action]");

      if (link) {
        event.preventDefault();
        const userId = Number(link.dataset.userId);
        const selected = users.find((user) => user.id === userId);
        renderDetail(selected);
        return;
      }

      if (actionButton) {
        const userId = Number(actionButton.dataset.userId);
        const selected = users.find((user) => user.id === userId);
        if (!selected) {
          return;
        }
        const action = actionButton.dataset.action;
        if (action === "patch") {
          const updates = {
            phone: `${selected.phone} ext. ${Math.floor(Math.random() * 90 + 10)}`,
            website: `patched-${selected.website}`,
          };
          patchUser(selected, updates);
        }
        if (action === "delete") {
          deleteUser(selected);
        }
      }
    });
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    tableStatus.textContent =
      "Ocurrio un error al cargar los usuarios. Revisa la consola.";
  }
};

const loadImages = async () => {
  imageStatus.textContent = "Cargando imagenes...";
  await Promise.all([
    loadBlobImage("./img/double-helix-svgrepo-com.svg", blobImageOne, "1"),
    loadBlobImage("./img/genetic-algorithm-svgrepo-com.svg", blobImageTwo, "2"),
  ]);
  if (!imageStatus.textContent.startsWith("Ocurrio")) {
    imageStatus.textContent = "Imagenes cargadas.";
  }
};

window.addEventListener("beforeunload", () => {
  [blobImageOne, blobImageTwo].forEach((img) => {
    if (img?.dataset?.blobUrl) {
      URL.revokeObjectURL(img.dataset.blobUrl);
    }
  });
});

loadUsers();
loadImages();
