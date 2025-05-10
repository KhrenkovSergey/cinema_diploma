import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.scss';
import { apiRequest } from './api';

/**
 * Функция для получения параметров из URL
 * @param {string} param - имя параметра
 * @returns {string | null} - значение параметра
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', async () => {
  // ————— Блок авторизации для админ‑панели —————
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const email = document.getElementById('login-email')?.value.trim();
      const password = document.getElementById('login-password')?.value.trim();
      if (!email || !password) {
        alert('Введите логин и пароль');
        return;
      }
      const formData = new FormData();
      formData.append('login', email);
      formData.append('password', password);
      try {
        const response = await fetch('https://shfe-diplom.neto-server.ru/login', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (data.success) {
          alert('Авторизация успешна!');
          localStorage.setItem('adminAuth', 'true');
          window.location.href = 'admin.html';
        } else {
          alert('Ошибка авторизации. Проверьте логин и пароль.');
        }
      } catch (e) {
        console.error(e);
        alert('Ошибка сети при авторизации');
      }
    });
    return; // дальше остальной код не выполняется
  }

  // ————— Защита админ‑страниц —————
  if (document.body.classList.contains('admin-page') &&
      localStorage.getItem('adminAuth') !== 'true') {
    alert('Необходимо авторизоваться для доступа к этой странице.');
    window.location.href = 'login.html';
    return;
  }

  // ————— Селекторы для всех страниц —————
  const scheduleContainer = document.getElementById('schedule');
  const hallContainer     = document.getElementById('hall');
  const bookButton        = document.getElementById('book');
  const hallsContainer    = document.getElementById('halls');
  const addHallForm       = document.getElementById('add-hall-form');
  const filmsContainer    = document.getElementById('films');
  const addFilmForm       = document.getElementById('add-film-form');
  const seancesContainer  = document.getElementById('seances');
  const addSeanceForm     = document.getElementById('add-seance-form');
  const seanceHallSelect  = document.getElementById('seance-hall');
  const seanceFilmSelect  = document.getElementById('seance-film');

  // ————— Главная страница: расписание —————
  if (scheduleContainer) {
    scheduleContainer.innerHTML = '<p>Загрузка расписания...</p>';
    const data = await apiRequest('alldata');
    if (!data) {
      scheduleContainer.innerHTML = '<p>Ошибка загрузки данных</p>';
    } else {
      scheduleContainer.innerHTML = '';
      data.films.forEach(film => {
        const filmBlock = document.createElement('div');
        // Добавляем класс 'col' для работы bootstrap-сетки
        filmBlock.classList.add('film', 'col');

        filmBlock.innerHTML = `
          <h3>${film.film_name}</h3>
          <img src="${film.film_poster}" alt="${film.film_name}" width="150">
          <p>Длительность: ${film.film_duration} мин</p>
        `;
        const seancesList = document.createElement('ul');
        data.seances
          .filter(s => s.seance_filmid === film.id)
          .forEach(seance => {
            const li = document.createElement('li');
            li.innerHTML = `
              Сеанс в ${seance.seance_time}
              <button class="select-seance" data-seance-id="${seance.id}">Выбрать</button>
            `;
            seancesList.append(li);
          });
        if (!seancesList.children.length) {
          seancesList.innerHTML = '<li>Нет сеансов</li>';
        }
        filmBlock.append(seancesList);
        scheduleContainer.append(filmBlock);
      });

      document.body.addEventListener('click', event => {
        if (event.target.classList.contains('select-seance')) {
          window.location.href = `booking.html?seanceId=${event.target.dataset.seanceId}`;
        }
      });
    }
  }

  // ————— Страница бронирования —————
  if (hallContainer) {
    hallContainer.innerHTML = '<p>Загрузка схемы зала...</p>';
    const seanceId = getQueryParam('seanceId');
    if (!seanceId) {
      hallContainer.innerHTML = '<p>Сеанс не выбран</p>';
    } else {
      const hallConfig = await apiRequest(`hallconfig?seanceId=${seanceId}&date=2025-02-14`);
      if (!hallConfig) {
        hallContainer.innerHTML = '<p>Ошибка загрузки данных</p>';
      } else {
        hallContainer.innerHTML = '';
        hallConfig.forEach((row, i) => {
          const rowDiv = document.createElement('div');
          rowDiv.classList.add('row');
          row.forEach((type, j) => {
            const cell = document.createElement('div');
            cell.classList.add('place', type);
            if (type !== 'taken') {
              cell.addEventListener('click', () => cell.classList.toggle('selected'));
            }
            cell.dataset.row   = i + 1;
            cell.dataset.place = j + 1;
            rowDiv.append(cell);
          });
          hallContainer.append(rowDiv);
        });

        if (bookButton) {
          bookButton.addEventListener('click', async () => {
            const selected = Array.from(hallContainer.querySelectorAll('.place.selected'));
            if (!selected.length) {
              alert('Выберите хотя бы одно место!');
              return;
            }
            const tickets = selected.map(c => ({
              row: +c.dataset.row,
              place: +c.dataset.place,
              coast: c.classList.contains('vip') ? 350 : 100
            }));
            const result = await apiRequest('ticket','POST',{
              seanceId,
              ticketDate: '2025-02-14',
              tickets: JSON.stringify(tickets)
            });
            if (result) {
              alert('Билеты успешно забронированы!');
              location.reload();
            } else {
              alert('Ошибка бронирования. Попробуйте снова.');
            }
          });
        }
      }
    }
  }

  // ————— Управление залами —————
  if (hallsContainer && addHallForm) {
    const loadHalls = async () => {
      hallsContainer.innerHTML = '<p>Загрузка залов...</p>';
      const data = await apiRequest('alldata');
      if (!data?.halls) {
        hallsContainer.innerHTML = '<p>Ошибка загрузки залов</p>';
      } else {
        hallsContainer.innerHTML = '';
        data.halls.forEach(hall => {
          const div = document.createElement('div');
          div.classList.add('hall');
          div.innerHTML = `
            <p>${hall.hall_name}</p>
            <button class="delete-hall" data-hall-id="${hall.id}">Удалить</button>
          `;
          hallsContainer.append(div);
        });

        hallsContainer.querySelectorAll('.delete-hall').forEach(btn => {
          btn.addEventListener('click', async () => {
            const hallId = btn.dataset.hallId;
            const res = await apiRequest(`hall/${hallId}`,'DELETE');
            if (res) {
              alert('Зал удалён');
              await loadHalls();
            } else {
              alert('Ошибка удаления зала');
            }
          });
        });
      }
    };
    await loadHalls();

    addHallForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('hall-name')?.value.trim();
      if (!name) {
        alert('Введите название зала');
        return;
      }
      const res = await apiRequest('hall','POST',{ hallName: name });
      if (res) {
        alert('Зал добавлен');
        await loadHalls();
        addHallForm.reset();
      } else {
        alert('Ошибка добавления зала');
      }
    });
  }

  // ————— Управление фильмами —————
  if (filmsContainer && addFilmForm) {
    const loadFilms = async () => {
      filmsContainer.innerHTML = '<p>Загрузка фильмов...</p>';
      const data = await apiRequest('alldata');
      if (!data?.films) {
        filmsContainer.innerHTML = '<p>Ошибка загрузки фильмов</p>';
      } else {
        filmsContainer.innerHTML = '';
        data.films.forEach(film => {
          const div = document.createElement('div');
          div.classList.add('film');
          div.innerHTML = `
            <p>${film.film_name} (${film.film_duration} мин, ${film.film_origin})</p>
            <img src="${film.film_poster}" alt="${film.film_name}" width="100">
            <button class="delete-film" data-film-id="${film.id}">Удалить</button>
          `;
          filmsContainer.append(div);
        });

        filmsContainer.querySelectorAll('.delete-film').forEach(btn => {
          btn.addEventListener('click', async () => {
            const filmId = btn.dataset.filmId;
            const res = await apiRequest(`film/${filmId}`,'DELETE');
            if (res) {
              alert('Фильм удалён');
              await loadFilms();
            } else {
              alert('Ошибка удаления фильма');
            }
          });
        });
      }
    };
    await loadFilms();

    addFilmForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('film-name')?.value.trim();
      const dur  = document.getElementById('film-duration')?.value.trim();
      const orig = document.getElementById('film-origin')?.value.trim();
      const file = document.getElementById('film-poster')?.files[0];
      if (!name || !dur || !orig || !file) {
        alert('Заполните все поля!');
        return;
      }
      const fd = new FormData();
      fd.append('filmName', name);
      fd.append('filmDuration', dur);
      fd.append('filmOrigin', orig);
      fd.append('filePoster', file);
      const res = await apiRequest('film','POST',fd);
      if (res) {
        alert('Фильм добавлен');
        await loadFilms();
        addFilmForm.reset();
      } else {
        alert('Ошибка добавления фильма');
      }
    });
  }

  // ————— Управление сеансами —————
  if (seancesContainer && addSeanceForm) {
    const loadSeances = async () => {
      seancesContainer.innerHTML = '<p>Загрузка сеансов...</p>';
      const data = await apiRequest('alldata');
      if (!data?.seances) {
        seancesContainer.innerHTML = '<p>Ошибка загрузки сеансов</p>';
      } else {
        seancesContainer.innerHTML = '';
        data.seances.forEach(s => {
          const film = data.films.find(f => f.id === s.seance_filmid);
          const hall = data.halls.find(h => h.id === s.seance_hallid);
          const div = document.createElement('div');
          div.classList.add('seance');
          div.innerHTML = `
            <p>Фильм: ${film?.film_name || 'Неизвестно'}</p>
            <p>Зал: ${hall?.hall_name || 'Неизвестно'}</p>
            <p>Время: ${s.seance_time}</p>
            <button class="delete-seance" data-seance-id="${s.id}">Удалить</button>
          `;
          seancesContainer.append(div);
        });

        seancesContainer.querySelectorAll('.delete-seance').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.seanceId;
            const res = await apiRequest(`seance/${id}`,'DELETE');
            if (res) {
              alert('Сеанс удалён');
              await loadSeances();
            } else {
              alert('Ошибка удаления сеанса');
            }
          });
        });
      }

      // заполняем селекты
      seanceHallSelect.innerHTML = '<option value="" disabled selected>Выберите зал</option>';
      seanceFilmSelect.innerHTML = '<option value="" disabled selected>Выберите фильм</option>';
      const allData = await apiRequest('alldata');
      allData.halls.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.id; opt.textContent = h.hall_name;
        seanceHallSelect.append(opt);
      });
      allData.films.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id; opt.textContent = f.film_name;
        seanceFilmSelect.append(opt);
      });
    };
    await loadSeances();

    addSeanceForm.addEventListener('submit', async e => {
      e.preventDefault();
      const hId = seanceHallSelect.value;
      const fId = seanceFilmSelect.value;
      const t   = document.getElementById('seance-time')?.value;
      if (!hId || !fId || !t) {
        alert('Заполните все поля!');
        return;
      }
      const res = await apiRequest('seance','POST',{
        seanceHallid: hId,
        seanceFilmid: fId,
        seanceTime: t
      });
      if (res) {
        alert('Сеанс добавлен');
        await loadSeances();
        addSeanceForm.reset();
      } else {
        alert('Ошибка добавления сеанса');
      }
    });
  }

  // ————— Конфигурация зала —————
  const cfgHallSelect = document.getElementById('config-hall-select');
  if (cfgHallSelect) {
    const cfgRowInput   = document.getElementById('config-row-count');
    const cfgPlaceInput = document.getElementById('config-place-count');
    const cfgSeatMap    = document.getElementById('config-seat-map');
    const saveCfgBtn    = document.getElementById('save-hall-config');
    const cancelCfgBtn  = document.getElementById('cancel-hall-config');

    const hallsData = await apiRequest('alldata');
    hallsData.halls.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h.id; opt.textContent = h.hall_name;
      cfgHallSelect.append(opt);
    });

    cfgHallSelect.addEventListener('change', () => {
      const hall = hallsData.halls.find(h => h.id == cfgHallSelect.value);
      if (cfgRowInput)   cfgRowInput.value   = hall.hall_rows;
      if (cfgPlaceInput) cfgPlaceInput.value = hall.hall_places;
      if (cfgSeatMap)    drawSeatMap(hall.hall_config);
    });

    function drawSeatMap(config) {
      if (!cfgSeatMap) return;
      cfgSeatMap.innerHTML = '';
      config.forEach((row, i) => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');
        row.forEach((type, j) => {
          const cell = document.createElement('div');
          cell.classList.add('place', type);
          cell.dataset.row   = i;
          cell.dataset.place = j;
          cell.addEventListener('click', () => {
            const next = { standart:'vip', vip:'disabled', disabled:'standart' }[cell.classList[1]];
            cell.classList.replace(cell.classList[1], next);
          });
          rowDiv.append(cell);
        });
        cfgSeatMap.append(rowDiv);
      });
    }

    if (saveCfgBtn) {
      saveCfgBtn.addEventListener('click', async () => {
        const hallId    = cfgHallSelect.value;
        const form      = new FormData();
        const newConfig = Array.from(cfgSeatMap.children).map(r =>
          Array.from(r.children).map(c => c.classList[1])
        );
        form.append('rowCount',   cfgRowInput.value);
        form.append('placeCount', cfgPlaceInput.value);
        form.append('config',     JSON.stringify(newConfig));
        const res = await fetch(`https://shfe-diplom.neto-server.ru/hall/${hallId}`, {
          method: 'POST',
          body: form
        }).then(r => r.json());
        alert(res.success ? 'Схема сохранена' : 'Ошибка сохранения');
      });
    }
    if (cancelCfgBtn) {
      cancelCfgBtn.addEventListener('click', () => {
        cfgHallSelect.selectedIndex = 0;
        if (cfgRowInput)   cfgRowInput.value   = '';
        if (cfgPlaceInput) cfgPlaceInput.value = '';
        if (cfgSeatMap)    cfgSeatMap.innerHTML = '';
      });
    }
  }

  // ————— Конфигурация цен —————
  const priceHallSelect = document.getElementById('price-hall-select');
  if (priceHallSelect) {
    const priceStdInput = document.getElementById('price-standard');
    const priceVipInput = document.getElementById('price-vip');
    const savePriceBtn  = document.getElementById('save-price-config');
    const cancelPriceBtn= document.getElementById('cancel-price-config');

    const hallsData = await apiRequest('alldata');
    hallsData.halls.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h.id; opt.textContent = h.hall_name;
      priceHallSelect.append(opt);
    });

    priceHallSelect.addEventListener('change', () => {
      const hall = hallsData.halls.find(h => h.id == priceHallSelect.value);
      if (priceStdInput) priceStdInput.value = hall.hall_price_standart;
      if (priceVipInput) priceVipInput.value = hall.hall_price_vip;
    });

    if (savePriceBtn) {
      savePriceBtn.addEventListener('click', async () => {
        const hallId = priceHallSelect.value;
        const form   = new FormData();
        form.append('priceStandart', priceStdInput.value);
        form.append('priceVip',       priceVipInput.value);
        const res = await fetch(`https://shfe-diplom.neto-server.ru/price/${hallId}`, {
          method: 'POST',
          body: form
        }).then(r => r.json());
        alert(res.success ? 'Цены сохранены' : 'Ошибка сохранения');
      });
    }
    if (cancelPriceBtn) {
      cancelPriceBtn.addEventListener('click', () => {
        priceHallSelect.selectedIndex = 0;
        if (priceStdInput) priceStdInput.value = '';
        if (priceVipInput) priceVipInput.value = '';
      });
    }
  }
});
