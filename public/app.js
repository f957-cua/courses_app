const toCurrency = price => {
  return new Intl.NumberFormat('ru-RU', {
    currency: 'rub',
    style: 'currency'
  }).format(price)
}

const toDate = date => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date))
}

document.querySelectorAll('.price').forEach(node => {
  node.textContent = toCurrency(node.textContent)
})

document.querySelectorAll('.date').forEach(node => { node.textContent = toDate(node.textContent) });

const $card = document.querySelector('#card');

// adding listener to the card element
if ($card) {
  $card.addEventListener('click', event => {
    
    // check if "js-remove" class element was clicked
    if (event.target.classList.contains('js-remove')) {
      
      // receive course id
      const id = event.target.dataset.id
      const csrf = event.target.dataset.csrf

      fetch("/card/remove/" + id, {
        method: "delete",
        headers: {
          "X-XSRF-TOKEN": csrf,
        },
      })
        .then((res) => res.json())
        .then((card) => {
          if (card.courses.length) {
            const html = card.courses
              .map((c) => {
                return `
              <tr>
                <td>${c.title}</td>
                <td>${c.count}</td>
                <td>
                  <button class="btb btn-small js-remove" data-id="${c._id}" data-csrf="${csrf}">Удалить</button>
                </td>
              </tr>
              `;
              })
              .join("");
            $card.querySelector(
              "tbody"
            ).innerHTML = html;
            $card.querySelector(
              ".price"
            ).textContent = toCurrency(
              card.price
            );
          } else {
            // delete table
            $card.innerHTML =
              "<p>Корзина пуста</p>";
          }
        });
      
    }
  })
}

// tabs content init
M.Tabs.init(document.querySelectorAll('.tabs'));