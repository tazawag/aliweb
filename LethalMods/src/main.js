document.addEventListener("DOMContentLoaded", function () {
    const config = document.querySelector("title").innerHTML.split(" ")[2] === "Config";

	let csvFilePath = "src/mods.csv";
    if (config) {
        csvFilePath = "../src/mods.csv";
    }

	fetch(csvFilePath)
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.text();
		})
		.then(csvText => displayCSV(csvText))
		.catch(error => console.error("Error loading CSV:", error));
});

function displayCSV(csvText) {
    const ama = document.querySelector("title").innerHTML === "Lethal Mods Webpage - Ama";

    const importantTable = document.getElementById("importantTable");
    const notImportantTable = document.getElementById("notImportantTable");
    const configTable = document.getElementById("configTable");
    if ((!importantTable || !notImportantTable) && !configTable) {
        console.error("Table element not found!");
        return;
    }

    const rows = csvText.trim().split("\n").map(row => row.split(";"));

    if (importantTable != null && notImportantTable != null) {
        importantTable.innerHTML = `<tr><th colspan="2">MODS IMPORTANTS</th></tr>`;
        notImportantTable.innerHTML = `<tr><th colspan="2">MODS OPTIONNELS</th></tr>`;
    }

    if (configTable != null) {
        configTable.innerHTML = `<tr><th colspan="2">MODS À CONFIGURER</th></tr>`;
    }

    const importantMods = [];
    const nonImportantMods = [];
    const configMods = [];

    let firstCol = true;
    rows.forEach(row => {
        if (row[0] !== "name") {
            let author = row[1].split("/")[6];
            if (author === "Catshape") {
                author = "Tazawa :P";
            }
            if (configTable != null) {
                if (row[6] === "true") {
                    let mod;
                    if (firstCol) {
                        mod = `<tr><td><a href=\"${row[0]}.html\">${row[0]}</a><br><span class="mod-author">Par ${author}</span></td>`;
                    } else {
                        mod = `<td><a href=\"${row[0]}.html\">${row[0]}</a><br><span class="mod-author">Par ${author}</span></td></tr>`;
                    }

                    firstCol = !firstCol;

                    configMods.push(mod);
                }
            } else {
                if (!ama || (ama && row[4] === "true")) {
                    let tags = row[5] ? row[5].split(",").map(tag => `<span class='mod-tag'>${tag.trim()}</span>`).join(" ") : "";
                    
                    const mod = `
                        <tr>
                            <td class="mod-cell">
                                <img src="src/img/mods/${row[0]}.png" width="50" height="50"/>
                                <span class="mod-name"><a href="${row[1]}" target="_blank">${row[0]}</a></span>
                                <span class="mod-author">Par ${author}</span>
                            </td>
                            <td>
                                ${row[2]}<br><br>
                                ${tags}
                            </td>
                        </tr>
                    `;
                    
                    if (row[3] === "true") {
                        importantMods.push(mod);
                    } else {
                        nonImportantMods.push(mod);
                    }
                }
            }
        }
    });
    if (!configTable) {
        importantTable.innerHTML += importantMods.join("");
        notImportantTable.innerHTML += nonImportantMods.join("");
    } else {
        if (!firstCol) {
            configMods.push("</td>");
        }
        configTable.innerHTML += configMods.join("");
    }
}

let offsetX = 0; // Position horizontale du fond
const speedX = 0.15; // Vitesse du déplacement horizontal
const speedY = 0.5; // Vitesse du parallax vertical

function animateBackground() {
    const scrolled = window.scrollY;
    offsetX -= speedX; // Déplace l’image vers la gauche
    document.querySelector('.parallax').style.backgroundPosition = `${offsetX}px ${-(scrolled * speedY)}px`;
    requestAnimationFrame(animateBackground);
}

// Lancer l'animation
animateBackground();