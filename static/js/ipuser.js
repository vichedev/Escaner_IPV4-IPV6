document.addEventListener("DOMContentLoaded", function () {
    // Obtener la IP del usuario
    fetch("https://api.ipify.org?format=json")
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("user-ip").textContent = data.ip;
      })
      .catch((error) => {
        console.error("Error al obtener la IP:", error);
        document.getElementById("user-ip").textContent = "No se pudo obtener la IP";
      });

    document
      .getElementById("port-option")
      .addEventListener("change", function () {
        var specificPortGroup = document.getElementById("specific-port-group");
        specificPortGroup.style.display = this.value === "specific" ? "block" : "none";
      });

    document
      .getElementById("scan-form")
      .addEventListener("submit", function (event) {
        event.preventDefault();
        var address = document.getElementById("address").value;
        var portOption = document.getElementById("port-option").value;
        var specificPort = document.getElementById("specific-port").value;

        // Mostrar alerta de carga con barra de progreso
        const loadingAlert = Swal.fire({
          title: "Escaneando...",
          html: `
            <div class="progress-container">
              <div class="progress-bar" id="progress-bar"></div>
              <div id="progress-text">0%</div>
            </div>
            <br>
            Por favor, espera mientras se escanean los puertos.
          `,
          allowOutsideClick: false,
          onBeforeOpen: () => {
            Swal.showLoading();
            updateProgress(); // Llama a la función para actualizar el progreso
          },
        });

        // Limpiar resultados anteriores
        document.getElementById("scan-results").innerHTML = "";
        document.getElementById("final-results").innerHTML = "";

        // Mostrar el contenedor de resultados
        document.getElementById("scan-results-container").style.display = "none"; // Mantenerlo oculto hasta obtener resultados

        fetch("/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: address,
            portOption: portOption,
            specificPort: specificPort,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            // Detener el progreso
            clearInterval(progressInterval);

            var resultsDiv = document.getElementById("final-results");
            var scanResults = document.getElementById("scan-results");

            // Mostrar el encabezado de puertos abiertos si existen
            if (data.open_ports.length > 0) {
              resultsDiv.innerHTML = `<h3>En la dirección <span class="highlight">${address}</span> hay <span class="highlight">${data.open_ports.length}</span> puertos abiertos: <span class="highlight">${data.open_ports.join(", ")}</span></h3>`;
            } else {
              resultsDiv.innerHTML = `<h3>No se encontraron puertos abiertos en ${address}.</h3>`;
            }

            // Mostrar resultados del escaneo
            data.scan.forEach((port) => {
              var item = document.createElement("li");
              item.className = "list-group-item";

              // Asignar clase según el estado del puerto
              if (port.status === "abierto") {
                item.classList.add("list-group-item-success");
              } else if (port.status === "cerrado") {
                item.classList.add("list-group-item-danger");
              } else if (port.status === "filtrado") {
                item.classList.add("list-group-item-warning");
              }

              item.textContent = `Puerto ${port.port}: ${port.status}`;
              scanResults.appendChild(item);
            });

            // Mostrar el contenedor de resultados
            document.getElementById("scan-results-container").style.display = "block";

            // Cerrar alerta de carga
            Swal.close();
          })
          .catch((error) => {
            console.error("Error:", error);
            Swal.fire(
              "Error",
              "Ocurrió un error al escanear los puertos.",
              "error"
            );
            Swal.close(); // Cerrar alerta de carga en caso de error
          });

        // Función para actualizar la barra de progreso
        let progress = 0;
        const progressBar = document.getElementById("progress-bar");
        const progressText = document.getElementById("progress-text");
        const progressInterval = setInterval(() => {
          progress += 10; // Aumenta el progreso en 10% cada intervalo
          if (progress > 100) {
            progress = 100;
            clearInterval(progressInterval);
          }
          progressBar.style.width = progress + "%";
          progressText.textContent = progress + "%";
        }, 1000); // Actualiza cada segundo
      });
  });