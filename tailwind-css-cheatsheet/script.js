document.getElementById('searchInput').addEventListener('keyup', function() {
            let filter = this.value.toUpperCase();
            let grid = document.querySelector('.grid');
            let cards = grid.getElementsByClassName('card');

            for (let i = 0; i < cards.length; i++) {
                let card = cards[i];
                let content = card.textContent || card.innerText;
                if (content.toUpperCase().indexOf(filter) > -1) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            }
        });
