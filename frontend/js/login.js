import { resetTable } from "./main.js";
import { initChildrenData } from "./definitions.js";
import { municipiosPorProvincia } from "./mgiscripts.js";
import { mostrarCampana, ocultarCampana } from "./alarmscripts.js";

// Verifica al arrancar la aplicacion que el servidor esta corriendo
// Ruta en el backend fichero server.js
async function isServerRunning() {
  try {
    const response = await fetch(`${window.config.apiUrl}/server`);
    if (response.ok) {
      console.log("Servidor activo y respondiendo");
      return true;
    } else {
      console.error("Servidor respondió, pero con error:", response.status);
      return false;
    }
  } catch (error) {
    console.error("No se pudo conectar al servidor:", error);
    alert("🛑 No se pudo conectar al servidor.");
    return false;
  }
}

isServerRunning();

function togglePassword(inputId, el) {
  const input = document.getElementById(inputId);
  if (!input) {
    console.warn("No existe input con id:", inputId);
    return;
  }

  if (input.type === "password") {
    input.type = "text";
    el.textContent = "🙈"; // cambia el icono
  } else {
    input.type = "password";
    el.textContent = "👁️";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".toggle-password").forEach((span) => {
    span.addEventListener("click", () => {
      const input = span.previousElementSibling;
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        span.textContent = "🙈";
      } else {
        input.type = "password";
        span.textContent = "👁️";
      }
    });
  });

  let userLogin = false;

  // Elementos para cambiar paneles
  const signUpButton = document.getElementById("cc-signUp");
  const signInButton = document.getElementById("cc-signIn");
  const container = document.getElementById("cc-container");

  signUpButton.addEventListener("click", () => {
    container.classList.add("cc-right-panel-active");
  });

  signInButton.addEventListener("click", () => {
    container.classList.remove("cc-right-panel-active");
  });

  // Inputs y botón del formulario de registro
  const userInputSignUp = document.querySelector(
    '.cc-sign-up-container input[type="text"]'
  );
  const emailInputSignUp = document.querySelector(
    '.cc-sign-up-container input[type="email"]'
  );
  const passwordInputSignUp = document.querySelector(
    '.cc-sign-up-container input[type="password"]'
  );
  const registerBtn = document.getElementById("cc-rsignUp");

  // Inputs y botón del formulario de inicio de sesión
  const userInputSignIn = document.querySelector(
    '.cc-sign-in-container input[type="text"]'
  );
  const passwordInputSignIn = document.querySelector(
    '.cc-sign-in-container input[type="password"]'
  );
  const loginBtn = document.getElementById("cc-login");
  const forgotPasswordLink = document.getElementById("ccrc-forgotPasswordLink");
  const userlogout = document.getElementById("userlogout");

  const wrapper = document.getElementById("cc-container-wrapper");

  let checknumber = 0;

  const provinceSelect = document.getElementById("province");
  const municipalitySelect = document.getElementById("municipality");
  const registerButton = document.getElementById("cc-rsignUp");

  // Llenar select de provincias
  Object.keys(municipiosPorProvincia).forEach((prov) => {
    const opt = document.createElement("option");
    opt.value = prov;
    opt.textContent = prov;
    provinceSelect.appendChild(opt);
  });

  // Cuando cambia provincia, actualizar municipios
  provinceSelect.addEventListener("change", () => {
    const selectedProv = provinceSelect.value;
    municipalitySelect.innerHTML =
      '<option value="" disabled selected hidden>Municipio</option>';
    if (selectedProv && municipiosPorProvincia[selectedProv]) {
      municipiosPorProvincia[selectedProv].forEach((mun) => {
        const opt = document.createElement("option");
        opt.value = mun;
        opt.textContent = mun;
        municipalitySelect.appendChild(opt);
      });
      municipalitySelect.disabled = false;
    } else {
      municipalitySelect.disabled = true;
    }
    checkFormValidity();
  });

  // Validar si todos los campos están llenos para habilitar botón
  const inputs = [
    document.getElementById("username"),
    document.getElementById("fullname"),
    document.getElementById("email"),
    document.getElementById("speciality"),
    provinceSelect,
    municipalitySelect,
    document.getElementById("registerPassword")
  ];

  inputs.forEach((input) => {
    input.addEventListener("input", checkFormValidity);
    input.addEventListener("change", checkFormValidity);
  });

  function checkFormValidity() {
    const allFilled = inputs.every(
      (input) => input.value && input.value.trim() !== ""
    );
    registerButton.disabled = !allFilled;
  }

  // Ruta # 2: Verifica si el usuario existe
  async function checkUserExists(id) {
    try {
      const response = await fetch(`${window.config.apiUrl}/users/${id}`);
      if (!response.ok) {
        console.error("Error en la respuesta del servidor:", response.status);
        return false;
      }
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      return false;
    }
  }

  // Ruta # 6: Envia un codigo al correo del; usuario para que pueda cambiar la contrasena
  async function enviarCodigoRecuperacion(username, codeForPass) {
    try {
      const response = await fetch(
        `${window.config.apiUrl}/send-recovery-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, codeForPass })
        }
      );

      if (!response.ok) {
        alert("Error enviando código de recuperación");
        return false;
      }

      alert("Código enviado correctamente");
      return true;
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
      return false;
    }
  }

  // Genera un número entre 10000000 y 99999999
  function randomNumber() {
    return Math.floor(10000000 + Math.random() * 90000000);
  }

  forgotPasswordLink.addEventListener("click", async (event) => {
    const userid = userInputSignIn.value;
    let userexists = false;

    if (userid.trim() !== "") {
      // No está vacío, tiene contenido
      event.preventDefault(); // evita que el enlace navegue
      userexists = await checkUserExists(userid);
      if (!userexists) {
        alert("🛑 El usuario no está registrado en el sistema");
        return;
      }

      checknumber = randomNumber();
      await enviarCodigoRecuperacion(userid, checknumber);
      modal.classList.add("open");
    } else {
      // Está vacío o solo contiene espacios en blanco
      alert("✋ Debe introducir un nombre de usuario.");
      userInputSignIn.focus();
      return;
    }
  });

  $(document).on("loginregisterevent", function () {
    //aqui
    if (userLogin) {
      userLogin = false;
      currentUser = [];
      initChildrenData();
      ocultarCampana();
      $(document).trigger("userlogoutevent");
      $(document).trigger("dashboard-userlogoutevent");

      //Ocultar GIF Children
      document.getElementById("child-loader").classList.add("d-none");
      // Ocultar imagen
      userlogout.style.display = "none";

      // Limpiar campos del dialogo
      userInputSignIn.value = "";
      passwordInputSignIn.value = "";

      // Mostrar botón
      const logout = document.getElementById("menuloginregister");
      logout.style.display = "inline-block";
      logout.style.cursor = "pointer";

      // Reasignar evento
      logout.addEventListener("click", () => {
        loginBtn.click(); // 👈 dispara el mismo evento asíncrono original
      });

      //Limpiar la tabla
      resetTable();
      return;
    }

    wrapper.classList.add("open");
  });

  // Función para validar contraseña (mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos)
  function validatePassword(password) {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return re.test(password);
  }

  // Valida que la dirrecion de correo tenga al menos el formato que debe tener
  function validateEmail(email) {
    // Expresión regular básica: algo@algo.algo
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Ruta #3: Inserta un nuevo usuario.
  async function insertnewuser(currentUser) {
    try {
      const response = await fetch(`${window.config.apiUrl}/newuser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(currentUser)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al insertar usuario:", errorData.error);
        alert("🛑 Error al insertar usuario.");
        return false;
      }

      const data = await response.json();
      console.log("Respuesta servidor:", data);
      return true;
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("🛑 Error de conexión.");
      return false;
    }
  }

  // Ruta # 4: login del usuario
  async function login(user, pass) {
    try {
      const response = await fetch(`${window.config.apiUrl}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass })
      });

      const data = await response.json();

      // ✅ FIX: Verificar mensaje de ERROR específicamente
      if (data.message && data.message !== "") {
        alert(data.message);
        return null;
      }

      // Login correcto ✅
      return data;
    } catch (err) {
      console.error("💥 Error conexión:", err);
      alert("Error al conectarse al servidor.");
      return null;
    }
  }

  // **************************

  // 👈 TU EVENT LISTENER MODIFICADO
  loginBtn.addEventListener("click", async () => {
    const user = userInputSignIn.value;
    const pass = passwordInputSignIn.value;

    if (user.length === 0 && pass.length === 0) {
      return;
    }

    try {
      const userData = await login(user, pass);

      if (userData) {
        window.currentUser = {
          userid: userData.userid,
          // ✅ NO devolver password por seguridad
          useremail: userData.useremail || "",
          userspec: userData.userspec || "",
          active: userData.active || 0,
          registeredpend: userData.registeredpend || 0,
          fullname: userData.fullname || "Sin nombre",
          municipality: userData.municipality || "",
          province: userData.province || "",

          // ✅ NOMBRES EXACTOS que espera window.puede() y window.tieneRol()
          rols: userData.rols || [], // ['superadmin']
          permissions: userData.permissions || [] // 29 permisos
        };

        console.log("window.currentUser: ", window.currentUser);

        // ✅ CORREGIDO: window.currentUser NO currentUser
        localStorage.setItem("currentUser", JSON.stringify(window.currentUser));

        wrapper.classList.remove("open");
        resetTable();
        userLogin = true;

        if (userLogin) {
          //Mostrar GIF Children
          if (
            window.tieneRol("superadmin") ||
            window.tieneRol("admin") ||
            window.tieneRol("superv") ||
            window.puede("sujeto_ver_listado_cdo") ||
            window.puede("sujeto_ver_listado_provincia") ||
            window.puede("sujeto_ver_listado_nivel_nacional") ||
            window.puede("sujeto_editar_cdo") ||
            window.puede("sujeto_editar_provincia") ||
            window.puede("sujeto_editar_nivel_nacional")
          ) {
            document.getElementById("child-loader").classList.remove("d-none");
          }

          const loginBtn = document.getElementById("menuloginregister");
          const userlogout = document.getElementById("userlogout"); // ✅ DESCOMENTAR

          loginBtn.style.display = "none";
          userlogout.style.display = "inline-block";
          userlogout.style.cursor = "pointer";

          // ✅ EVENT LISTENER del logout (DESCOMENTAR)
          userlogout.addEventListener("click", () => {
            window.currentUser = null;
            userLogin = false;
            localStorage.removeItem("currentUser");
            window.location.reload();
          });

          $(document).trigger("newuserevent");
          $(document).trigger("dashboard-newuserevent");

          mostrarCampana();
          $(document).trigger("initalarmsystemevent");
        }
      }
    } catch (error) {
      console.error("Error en login:", error);
    }
  });

  // ****************************
  async function obtenerPermisosPorRol(roles, username) {
    try {
      const response = await fetch(`${window.config.apiUrl}/permisos/por-rol`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roles,
          username
        })
      });

      const data = await response.json();

      if (data.permisos) {
        return data.permisos; // ["sujeto_estudiar", "usuario_registrarse", ...]
      }

      return [];
    } catch (error) {
      console.error("Error obteniendo permisos:", error);
      return [];
    }
  }

  // Al hacer clic en el botón de registro:
  registerBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = userInputSignUp.value.trim();
    const fullname = document.getElementById("fullname");
    const fullnameSelected = fullname.value.trim();
    const email = emailInputSignUp.value.trim();
    const password = passwordInputSignUp.value;
    const selectSpec = document.getElementById("speciality");
    const province = document.getElementById("province");
    const provinceSelected = province.value.trim();
    const municipality = document.getElementById("municipality");
    const municipalitySelected = municipality.value.trim();
    const specSelected = selectSpec.value.trim(); // ✅ Trim aplicado

    // ✅ Validación completa del ENUM userspec
    const allowedSpecs = [
      "Ninguno",
      "Psicología",
      "Psicopedagogía",
      "Logopedia",
      "Psicometría",
      "Pedagogía"
    ];

    console.log(
      "🔍 DEBUG - Valor especialidad recibido:",
      JSON.stringify(specSelected)
    );

    if (!allowedSpecs.includes(specSelected)) {
      alert(
        `🛑 Especialidad inválida: "${specSelected}".\nDebe ser una de: ${allowedSpecs.join(
          ", "
        )}`
      );
      selectSpec.focus();
      return;
    }

    if (!fullnameSelected) {
      alert("🛑 Debe introducir su nombre y apellidos");
      fullname.focus();
      return;
    }

    if (!validateEmail(email)) {
      alert("🛑 El correo electrónico no es válido.");
      emailInputSignUp.focus();
      return;
    }

    if (!validatePassword(password)) {
      alert(
        "🛑 La contraseña no es válida. Debe tener al menos 8 caracteres que incluya letras mayúsculas, minúsculas, números y símbolos."
      );
      passwordInputSignUp.focus();
      return;
    }

    if (!provinceSelected) {
      console.log("🛑 Debe seleccionar una provincia.");
      province.focus();
      return;
    }

    if (!municipalitySelected) {
      console.log("🛑 Debe seleccionar un municipio.");
      municipality.focus();
      return;
    }

    const exists = await checkUserExists(username);

    if (exists) {
      console.log("🛑 El usuario ya existe.");
      userInputSignUp.focus();
      return;
    }

    const rolesPorDefecto = ["user"];
    const permisosUser = await obtenerPermisosPorRol(rolesPorDefecto, username);

    const newUser = {
      userid: username,
      userpass: password,
      useremail: email,
      userspec: specSelected, // ✅ Ya validado arriba
      active: 0,
      registeredpend: 1,
      fullname: fullnameSelected,
      municipality: municipalitySelected,
      province: provinceSelected,
      roles: rolesPorDefecto,
      permissions: permisosUser
    };

    console.log("📤 Enviando al backend:", newUser); // ✅ Debug final

    if (await insertnewuser(newUser)) {
      window.currentUser = newUser;
      localStorage.setItem("currentUser", JSON.stringify(window.currentUser));
      alert("✅ Registro efectuado satisfactoriamente.");
    } else {
      alert("❌ No se pudo efectuar el registro.");
    }

    container.classList.remove("cc-right-panel-active");
  });

  // Cuando el usuario haga clic en cualquier lugar fuera de la ventana modal, ciérrala
  wrapper.addEventListener("click", (e) => {
    if (e.target === wrapper) {
      wrapper.classList.remove("open");
    }
  });

  // ========== DIALOGO NEWPASS ==========
  const modal = document.getElementById("newpass-modal");
  const closeBtn = document.getElementById("newpass-closeBtn");
  const submitBtn = document.getElementById("newpass-submit");
  const codeInput = document.getElementById("newpass-code");
  const passInput = document.getElementById("newpass-password");

  // Cerrar modal
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
  });

  // Ruta # 7: Actualiza la contrasena
  async function actualizarPassword(username, newpass) {
    try {
      const response = await fetch(`${window.config.apiUrl}/update-password`, {
        method: "PUT", // o POST si prefieres
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, newpass })
      });
      if (!response.ok) {
        const error = await response.json();
        alert(
          "🛑 Error al actualizar la contraseña: " +
            (error.message || error.error)
        );
        return false;
      }
      alert("👍 Contraseña actualizada correctamente");
      return true;
    } catch (error) {
      console.error("Error en actualizarPassword:", error);
      alert("🛑 Error en la conexión");
      return false;
    }
  }

  // Guardar datos
  submitBtn.addEventListener("click", async () => {
    const code = codeInput.value.trim();
    const newPass = passInput.value.trim();

    if (!code || !newPass) {
      alert("⚠️ Debe completar todos los campos.");
      return;
    }

    if (code !== checknumber.toString()) {
      alert("⚠️ Código no válido.");
      codeInput.focus();
      return;
    }

    //Validar la contrasena
    if (!validatePassword(newPass)) {
      alert(
        "🛑 La contraseña no es válida. Debe tener al menos 8 caracteres que incluya letras mayúsculas, minúsculas, números y símbolos."
      );
      passInput.focus();
      return;
    }
    const userid = userInputSignIn.value;
    await actualizarPassword(userid, newPass);
    modal.classList.remove("open");
  });

  // Cerrar modal al hacer click fuera del contenido
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
    }
  });

  if (userlogout) {
    userlogout.addEventListener("click", () => {
      // 👈 NUEVO: Limpiar datos al logout
      window.currentUser = null;
      userLogin = false;
      localStorage.removeItem("currentUser");
      window.location.reload();

      initChildrenData();
      loginBtn.click();

      // 👈 NUEVO: Ocultar elementos admin
      document.querySelectorAll("[data-requires-admin]").forEach((el) => {
        el.style.display = "none";
      });
    });
  }
  if (!userLogin && window.currentUser) {
    userLogin = true;
    const loginBtnEl = document.getElementById("menuloginregister");
    const logoutEl = document.getElementById("userlogout");
    if (loginBtnEl) loginBtnEl.style.display = "none";
    if (logoutEl) logoutEl.style.display = "inline-block";
  }
});
