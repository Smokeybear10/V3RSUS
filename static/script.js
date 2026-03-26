document.addEventListener("DOMContentLoaded", () => {
    const f1Input = document.getElementById("fighter1");
    const f2Input = document.getElementById("fighter2");
    const ac1 = document.getElementById("autocomplete1");
    const ac2 = document.getElementById("autocomplete2");
    
    let allFighters = [];

    // Fetch fighters list on load
    fetch("/api/fighters")
        .then(res => res.json())
        .then(data => {
            allFighters = data.fighters || [];
            console.log("Loaded fighters: ", allFighters.length);
        })
        .catch(err => console.error(err));

    function setupAutocomplete(inputEl, listEl) {
        inputEl.addEventListener("input", function() {
            const val = this.value;
            listEl.innerHTML = "";
            if (!val) {
                listEl.classList.add("hidden");
                return;
            }
            
            const matches = allFighters.filter(f => f.toLowerCase().includes(val.toLowerCase())).slice(0, 10);
            if (matches.length > 0) {
                listEl.classList.remove("hidden");
                matches.forEach(match => {
                    const li = document.createElement("li");
                    // highlight matching text
                    const regex = new RegExp(`(${val})`, "gi");
                    li.innerHTML = match.replace(regex, "<strong>$1</strong>");
                    li.addEventListener("click", () => {
                        inputEl.value = match;
                        listEl.innerHTML = "";
                        listEl.classList.add("hidden");
                    });
                    listEl.appendChild(li);
                });
            } else {
                listEl.classList.add("hidden");
            }
        });

        document.addEventListener("click", function(e) {
            if (e.target !== inputEl && e.target !== listEl) {
                listEl.classList.add("hidden");
            }
        });
    }

    setupAutocomplete(f1Input, ac1);
    setupAutocomplete(f2Input, ac2);

    const matchBtn = document.getElementById("predict-btn");
    const btnText = document.querySelector(".btn-text");
    const loader = document.querySelector(".loader");
    const resultSec = document.getElementById("result-section");
    const winnerName = document.getElementById("winner-name");
    const confVal = document.getElementById("confidence-val");
    const confFill = document.getElementById("confidence-fill");

    matchBtn.addEventListener("click", () => {
        const fighter1 = f1Input.value.trim();
        const fighter2 = f2Input.value.trim();

        if (!fighter1 || !fighter2) {
            alert("Please select both fighters.");
            return;
        }

        // Hide result, show loader
        resultSec.classList.add("hidden");
        btnText.classList.add("hidden");
        loader.classList.remove("hidden");
        matchBtn.disabled = true;

        fetch("/api/predict", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ fighter1, fighter2 })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert("Error: " + data.error);
            } else {
                // Show result
                winnerName.textContent = data.winner;
                const pct = (data.confidence * 100).toFixed(1);
                confVal.textContent = `${pct}%`;
                
                // Trigger animation by setting width to 0 then after a tiny delay setting it to pct
                confFill.style.width = "0%";
                
                resultSec.classList.remove("hidden");
                
                setTimeout(() => {
                    confFill.style.width = `${pct}%`;
                }, 100);
            }
        })
        .catch(err => {
            console.error(err);
            alert("Network error.");
        })
        .finally(() => {
            btnText.classList.remove("hidden");
            loader.classList.add("hidden");
            matchBtn.disabled = false;
        });
    });
});
