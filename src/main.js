import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.scss';
import { apiRequest } from './api';

function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

// Фоновый класс для каждой страницы по макету
if (document.body.classList.contains('admin-page')) {
  document.body.classList.add('bg-admin');
} else if (document.body.classList.contains('login-page')) {
  document.body.classList.add('bg-login');
} else if (window.location.pathname.includes('booking')) {
  document.body.classList.add('bg-booking');
} else {
  document.body.classList.add('bg-main');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Авторизация администратора
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();
      if (!email || !password) {
        alert('Введите логин и пароль');
        return;
      }
      const fd = new FormData();
      fd.append('login', email);
      fd.append('password', password);
      const res = await fetch('https://shfe-diplom.neto-server.ru/login', {
        method: 'POST',
        body: fd
      }).then(r => r.json());
      if (res.success) {
        localStorage.setItem('adminAuth', 'true');
        window.location.href = 'admin.html';
      } else {
        alert('Ошибка авторизации. Проверьте логин и пароль.');
      }
    });
    return;
  }

  // Защита админ-страниц
  if (document.body.classList.contains('admin-page') &&
    localStorage.getItem('adminAuth') !== 'true') {
    alert('Необходимо авторизоваться для доступа к этой странице.');
    window.location.href = 'login.html';
    return;
  }

  // Все необходимые элементы на странице
  const scheduleContainer = document.getElementById('schedule');
  const hallContainer = document.getElementById('hall');
  const bookButton = document.getElementById('book');
  const bookingInfo = document.getElementById('booking-info');
  const hallsContainer = document.getElementById('halls');
  const addHallForm = document.getElementById('add-hall-form');
  const filmsContainer = document.getElementById('films');
  const showAddFilmBtn = document.getElementById('show-add-film');
  const addFilmModal = document.getElementById('add-film-modal');
  const cancelAddFilmBtn = document.getElementById('cancel-add-film');
  const addFilmForm = document.getElementById('add-film-form');
  const seancesContainer = document.getElementById('seances');
  const showAddSeanceBtn = document.getElementById('show-add-seance');
  const addSeanceModal = document.getElementById('add-seance-modal');
  const cancelAddSeanceBtn = document.getElementById('cancel-add-seance');
  const addSeanceForm = document.getElementById('add-seance-form');
  const seanceHallSelect = document.getElementById('seance-hall');
  const seanceFilmSelect = document.getElementById('seance-film');

  // Модалки фильмов/сеансов
  if (showAddFilmBtn && addFilmModal && cancelAddFilmBtn) {
    showAddFilmBtn.addEventListener('click', () => addFilmModal.classList.remove('hidden'));
    cancelAddFilmBtn.addEventListener('click', () => addFilmModal.classList.add('hidden'));
  }
  if (showAddSeanceBtn && addSeanceModal && cancelAddSeanceBtn) {
    showAddSeanceBtn.addEventListener('click', () => addSeanceModal.classList.remove('hidden'));
    cancelAddSeanceBtn.addEventListener('click', () => addSeanceModal.classList.add('hidden'));
  }

  // --- ГЛАВНАЯ: Bootstrap-сетка фильмов ---
  if (scheduleContainer) {
    scheduleContainer.innerHTML = '';
    const data = await apiRequest('alldata');
    if (!data) {
      scheduleContainer.innerHTML = '<p>Ошибка загрузки данных</p>';
    } else {
      data.films.forEach(film => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-4 d-flex align-items-stretch mb-4';

        const filmBlock = document.createElement('div');
        filmBlock.className = 'film card shadow-sm w-100 h-100 d-flex flex-column justify-content-between';

        filmBlock.innerHTML = `
          <img src="${film.film_poster}" alt="${film.film_name}" class="film-poster card-img-top" style="max-height:220px;object-fit:cover;">
          <div class="card-body d-flex flex-column">
            <h3 class="h5 card-title mb-2">${film.film_name}</h3>
            <div class="mb-1 text-muted" style="font-size: 13px;">${film.film_origin || ''}${film.film_duration ? ', ' + film.film_duration + ' мин' : ''}</div>
            <div class="mb-2" style="font-size: 14px;">${film.film_description ? film.film_description : ''}</div>
          </div>
        `;

        // Сеансы по залам
        const filmSeances = data.seances.filter(s => s.seance_filmid === film.id);
        const hallsById = {};
        data.halls.forEach(hall => { hallsById[hall.id] = hall.hall_name; });
        const seancesByHall = {};
        filmSeances.forEach(s => {
          if (!seancesByHall[s.seance_hallid]) seancesByHall[s.seance_hallid] = [];
          seancesByHall[s.seance_hallid].push(s);
        });

        const seanceBlock = document.createElement('div');
        seanceBlock.className = 'card-footer bg-white border-0 mt-auto';
        Object.entries(seancesByHall).forEach(([hallId, seances]) => {
          const hallName = hallsById[hallId] || 'Зал';
          const hallDiv = document.createElement('div');
          hallDiv.className = 'mb-2';
          hallDiv.innerHTML = `<div class="fw-bold mb-1">${hallName}</div>`;

          const btnGroup = document.createElement('div');
          btnGroup.className = 'd-flex flex-wrap gap-2 mb-2';
          seances.forEach(seance => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-primary btn-sm select-seance';
            btn.textContent = seance.seance_time;
            btn.dataset.seanceId = seance.id;
            btn.style.minWidth = '60px';
            btnGroup.append(btn);
          });

          hallDiv.append(btnGroup);
          seanceBlock.append(hallDiv);
        });

        if (!filmSeances.length) {
          seanceBlock.innerHTML = '<div class="text-muted">Нет сеансов</div>';
        }

        filmBlock.append(seanceBlock);
        col.append(filmBlock);
        scheduleContainer.append(col);
      });

      document.body.addEventListener('click', event => {
        if (event.target.classList.contains('select-seance')) {
          window.location.href = `booking.html?seanceId=${event.target.dataset.seanceId}`;
        }
      });
    }
  }

  // --- БРОНИРОВАНИЕ С ИНФОЙ О ФИЛЬМЕ/СЕАНСЕ ---
  if (hallContainer && bookingInfo) {
    hallContainer.innerHTML = '<p>Загрузка зала…</p>';
    bookingInfo.innerHTML = '<p>Загрузка информации…</p>';
    const seanceId = getQueryParam('seanceId');
    if (!seanceId) {
      hallContainer.innerHTML = '<p>Сеанс не выбран</p>';
      bookingInfo.innerHTML = '';
    } else {
      const allData = await apiRequest('alldata');
      const seance = allData?.seances?.find(s => String(s.id) === seanceId);
      const film = seance ? allData.films.find(f => f.id === seance.seance_filmid) : null;
      const hall = seance ? allData.halls.find(h => h.id === seance.seance_hallid) : null;

      if (seance && film && hall) {
        bookingInfo.innerHTML = `
        <div class="row align-items-center g-2">
          <div class="col-12 col-md-3 d-flex justify-content-center">
            <img src="${film.film_poster}" alt="${film.film_name}" class="film-poster" style="max-width:110px;max-height:160px;">
          </div>
          <div class="col-12 col-md-9">
            <h2 class="h5 mb-2">${film.film_name}</h2>
            <div class="mb-1 text-muted" style="font-size: 13px;">
              ${film.film_origin || ''}${film.film_duration ? ', ' + film.film_duration + ' мин' : ''}
            </div>
            <div class="mb-2" style="font-size: 14px;">${film.film_description || ''}</div>
            <div class="mb-1">
              <b>Зал:</b> ${hall.hall_name} <b>Время:</b> ${seance.seance_time}
            </div>
            <div class="mb-1">
              <b>Дата:</b> <span id="booking-date">${new Date().toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
        </div>
      `;
        document.getElementById('standart-price').textContent = hall.hall_price_standart;
        document.getElementById('vip-price').textContent = hall.hall_price_vip;
      } else {
        bookingInfo.innerHTML = '<p>Ошибка загрузки информации о фильме или сеансе</p>';
      }

      const cfg = await apiRequest(`hallconfig?seanceId=${seanceId}&date=2025-02-14`);
      if (!cfg) {
        hallContainer.innerHTML = '<p>Ошибка загрузки данных</p>';
      } else {
        hallContainer.innerHTML = '';
        cfg.forEach((rowArr, i) => {
          const rowDiv = document.createElement('div');
          rowDiv.classList.add('row', 'justify-content-center');
          rowArr.forEach((type, j) => {
            const cell = document.createElement('div');
            cell.classList.add('place', type);
            if (type !== 'taken') {
              cell.addEventListener('click', () => cell.classList.toggle('selected'));
            }
            cell.dataset.row = i + 1;
            cell.dataset.place = j + 1;
            rowDiv.append(cell);
          });
          hallContainer.append(rowDiv);
        });

        if (bookButton) {
          bookButton.addEventListener('click', async () => {
            const sel = Array.from(hallContainer.querySelectorAll('.place.selected'));
            if (!sel.length) {
              alert('Выберите хотя бы одно место!');
              return;
            }
            const tickets = sel.map(c => ({
              row: +c.dataset.row,
              place: +c.dataset.place,
              coast: c.classList.contains('vip') ? hall.hall_price_vip : hall.hall_price_standart
            }));
            const res = await apiRequest('ticket', 'POST', {
              seanceId,
              ticketDate: '2025-02-14',
              tickets: JSON.stringify(tickets)
            });
            if (res) {
              alert('Билеты успешно забронированы!');
              location.reload();
            } else {
              alert('Ошибка бронирования');
            }
          });
        }
      }
    }
  }

  // ——— Управление залами ———
  if (hallsContainer && addHallForm) {
    async function loadHalls() {
      hallsContainer.innerHTML = '<p>Загрузка залов…</p>';
      const d = await apiRequest('alldata');
      if (!d?.halls) {
        hallsContainer.innerHTML = '<p>Ошибка загрузки залов</p>';
        return;
      }
      hallsContainer.innerHTML = '';
      d.halls.forEach(h => {
        const div = document.createElement('div');
        div.classList.add('hall', 'd-flex', 'justify-content-between', 'align-items-center', 'mb-2');
        div.innerHTML = `
          <span>${h.hall_name}</span>
          <button class="delete-hall btn btn-danger btn-sm" data-hall-id="${h.id}">
            Удалить
          </button>`;
        hallsContainer.append(div);
      });
      hallsContainer.querySelectorAll('.delete-hall').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (await apiRequest(`hall/${btn.dataset.hallId}`, 'DELETE')) {
            loadHalls();
          } else {
            alert('Ошибка удаления зала');
          }
        });
      });
    }
    await loadHalls();
    addHallForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('hall-name').value.trim();
      if (!name) {
        alert('Введите название зала');
        return;
      }
      if (await apiRequest('hall', 'POST', { hallName: name })) {
        addHallForm.reset();
        loadHalls();
      } else {
        alert('Ошибка добавления зала');
      }
    });
  }

  // ——— Управление фильмами ———
  if (filmsContainer && addFilmForm) {
    async function loadFilms() {
      filmsContainer.innerHTML = '<p>Загрузка фильмов…</p>';
      const d = await apiRequest('alldata');
      if (!d?.films) {
        filmsContainer.innerHTML = '<p>Ошибка загрузки фильмов</p>';
        return;
      }
      filmsContainer.innerHTML = '';
      d.films.forEach(f => {
        const div = document.createElement('div');
        div.classList.add('film', 'd-flex', 'justify-content-between', 'align-items-center', 'mb-2');
        div.innerHTML = `
          <span>${f.film_name} (${f.film_duration} мин)</span>
          <button class="delete-film btn btn-danger btn-sm" data-film-id="${f.id}">
            Удалить
          </button>`;
        filmsContainer.append(div);
      });
      filmsContainer.querySelectorAll('.delete-film').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (await apiRequest(`film/${btn.dataset.filmId}`, 'DELETE')) {
            loadFilms();
          } else {
            alert('Ошибка удаления фильма');
          }
        });
      });
    }
    await loadFilms();
    addFilmForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(addFilmForm);
      const res = await apiRequest('film', 'POST', fd);
      if (res) {
        alert('Фильм добавлен');
        addFilmForm.reset();
        addFilmModal.classList.add('hidden');
        loadFilms();
      } else {
        alert('Ошибка добавления фильма');
      }
    });
  }

  // ——— Управление сеансами ———
  if (seancesContainer && addSeanceForm) {
    async function loadSeances() {
      seancesContainer.innerHTML = '<p>Загрузка сеансов…</p>';
      const d = await apiRequest('alldata');
      if (!d?.seances) {
        seancesContainer.innerHTML = '<p>Ошибка загрузки сеансов</p>';
        return;
      }
      seancesContainer.innerHTML = '';
      d.seances.forEach(s => {
        const filmName = d.films.find(f => f.id === s.seance_filmid)?.film_name || '—';
        const hallName = d.halls.find(h => h.id === s.seance_hallid)?.hall_name || '—';
        const div = document.createElement('div');
        div.classList.add('seance', 'd-flex', 'justify-content-between', 'align-items-center', 'mb-2');
        div.innerHTML = `
          <span>${filmName} — ${hallName} — ${s.seance_time}</span>
          <button class="delete-seance btn btn-danger btn-sm" data-seance-id="${s.id}">
            Удалить
          </button>`;
        seancesContainer.append(div);
      });
      seancesContainer.querySelectorAll('.delete-seance').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (await apiRequest(`seance/${btn.dataset.seanceId}`, 'DELETE')) {
            loadSeances();
          } else {
            alert('Ошибка удаления сеанса');
          }
        });
      });
      // Обновляем селекты формы
      seanceHallSelect.innerHTML = '<option value="" disabled selected>Выберите зал</option>';
      seanceFilmSelect.innerHTML = '<option value="" disabled selected>Выберите фильм</option>';
      d.halls.forEach(h => {
        const o = document.createElement('option');
        o.value = h.id; o.textContent = h.hall_name;
        seanceHallSelect.append(o);
      });
      d.films.forEach(f => {
        const o = document.createElement('option');
        o.value = f.id; o.textContent = f.film_name;
        seanceFilmSelect.append(o);
      });
    }
    await loadSeances();
    addSeanceForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(addSeanceForm);
      const res = await apiRequest('seance', 'POST', fd);
      if (res) {
        alert('Сеанс добавлен');
        addSeanceForm.reset();
        addSeanceModal.classList.add('hidden');
        loadSeances();
      } else {
        alert('Ошибка добавления сеанса');
      }
    });
  }

  // ——— Конфигурация зала ———
  const cfgHallSelect = document.getElementById('config-hall-select');
  if (cfgHallSelect) {
    const cfgRowInput = document.getElementById('config-row-count');
    const cfgPlaceInput = document.getElementById('config-place-count');
    const cfgSeatMap = document.getElementById('config-seat-map');
    const saveCfgBtn = document.getElementById('save-hall-config');
    const cancelCfgBtn = document.getElementById('cancel-hall-config');

    const allData = await apiRequest('alldata');
    allData.halls.forEach(h => {
      const o = document.createElement('option');
      o.value = h.id; o.textContent = h.hall_name;
      cfgHallSelect.append(o);
    });

    cfgHallSelect.addEventListener('change', () => {
      const hall = allData.halls.find(h => h.id == cfgHallSelect.value);
      cfgRowInput.value = hall.hall_rows;
      cfgPlaceInput.value = hall.hall_places;
      drawSeatMap(hall.hall_config);
    });

    function drawSeatMap(config) {
      cfgSeatMap.innerHTML = '';
      config.forEach((row, i) => {
        const rd = document.createElement('div');
        rd.classList.add('row', 'justify-content-center');
        row.forEach((type, j) => {
          const c = document.createElement('div');
          c.classList.add('place', type);
          c.dataset.row = i;
          c.dataset.place = j;
          c.addEventListener('click', () => {
            const next = { standart: 'vip', vip: 'disabled', disabled: 'standart' }[c.classList[1]];
            c.classList.replace(c.classList[1], next);
          });
          rd.append(c);
        });
        cfgSeatMap.append(rd);
      });
    }

    saveCfgBtn.addEventListener('click', async () => {
      const hallId = cfgHallSelect.value;
      const fd2 = new FormData();
      const newCfg = Array.from(cfgSeatMap.children).map(rd =>
        Array.from(rd.children).map(c => c.classList[1])
      );
      fd2.append('rowCount', cfgRowInput.value);
      fd2.append('placeCount', cfgPlaceInput.value);
      fd2.append('config', JSON.stringify(newCfg));
      const r = await fetch(`https://shfe-diplom.neto-server.ru/hall/${hallId}`, {
        method: 'POST', body: fd2
      }).then(r => r.json());
      alert(r.success ? 'Схема сохранена' : 'Ошибка сохранения');
    });
    cancelCfgBtn.addEventListener('click', () => {
      cfgHallSelect.selectedIndex = 0;
      cfgRowInput.value = '';
      cfgPlaceInput.value = '';
      cfgSeatMap.innerHTML = '';
    });
  }

  // ——— Конфигурация цен ———
  const priceHallSelect = document.getElementById('price-hall-select');
  if (priceHallSelect) {
    const priceStdInput = document.getElementById('price-standard');
    const priceVipInput = document.getElementById('price-vip');
    const savePriceBtn = document.getElementById('save-price-config');
    const cancelPriceBtn = document.getElementById('cancel-price-config');

    const { halls } = await apiRequest('alldata');
    halls.forEach(h => {
      const o = document.createElement('option');
      o.value = h.id; o.textContent = h.hall_name;
      priceHallSelect.append(o);
    });

    priceHallSelect.addEventListener('change', () => {
      const hall = halls.find(h => h.id == priceHallSelect.value);
      priceStdInput.value = hall.hall_price_standart;
      priceVipInput.value = hall.hall_price_vip;
    });

    savePriceBtn.addEventListener('click', async () => {
      const hallId = priceHallSelect.value;
      const fd3 = new FormData();
      fd3.append('priceStandart', priceStdInput.value);
      fd3.append('priceVip', priceVipInput.value);
      const r = await fetch(`https://shfe-diplom.neto-server.ru/price/${hallId}`, {
        method: 'POST', body: fd3
      }).then(r => r.json());
      alert(r.success ? 'Цены сохранены' : 'Ошибка сохранения');
    });
    cancelPriceBtn.addEventListener('click', () => {
      priceHallSelect.selectedIndex = 0;
      priceStdInput.value = '';
      priceVipInput.value = '';
    });
  }

  // --- Открытие/закрытие продаж ---
  const openSaleList = document.getElementById('open-sale-list');
  const openSaleBtn = document.getElementById('open-sale-btn');

  if (openSaleList && openSaleBtn) {
    const { halls } = await apiRequest('alldata');
    // Создаём radio-кнопки для залов
    halls.forEach(hall => {
      const wrap = document.createElement('label');
      wrap.style.display = "flex";
      wrap.style.alignItems = "center";
      wrap.style.gap = "7px";
      wrap.innerHTML = `
      <input type="radio" name="open-sale-hall" value="${hall.id}" class="admin-radio">
      <span>${hall.hall_name}</span>
      <span class="admin-status">${hall.hall_open === 1 ? 'Открыто' : 'Закрыто'}</span>
    `;
      openSaleList.append(wrap);
    });

    openSaleBtn.textContent = 'Открыть продажи';

    openSaleBtn.addEventListener('click', async () => {
      const selected = openSaleList.querySelector('input[name="open-sale-hall"]:checked');
      if (!selected) {
        alert('Выберите зал!');
        return;
      }
      const hallId = selected.value;
      const currentStatus = halls.find(h => h.id == hallId).hall_open;
      const fd = new FormData();
      fd.append('hallOpen', currentStatus === 1 ? '0' : '1');
      const r = await fetch(`https://shfe-diplom.neto-server.ru/open/${hallId}`, {
        method: 'POST',
        body: fd
      }).then(r => r.json());
      if (r.success) {
        alert(currentStatus === 1 ? 'Продажи закрыты' : 'Продажи открыты');
        window.location.reload();
      } else {
        alert('Ошибка смены статуса');
      }
    });
  }

// --- DnD сетка сеансов (таймлайн, аккуратный, уникальные залы, фон) ---
const dndFilmsList = document.getElementById('dnd-films-list');
const dndTimelines = document.getElementById('dnd-timelines');
const saveTimelineBtn = document.getElementById('save-timeline');

// Фоновые картинки (см. main.scss ниже!)
if (document.body.classList.contains('admin-page')) {
  document.body.classList.add('bg-admin');
} else if (window.location.pathname.includes('booking')) {
  document.body.classList.add('bg-booking');
} else {
  document.body.classList.add('bg-main');
}

if (dndFilmsList && dndTimelines && saveTimelineBtn) {
  // Получаем данные БЕЗ дублей залов
  const allData = await apiRequest('alldata');
  const films = allData.films;
  // фильтруем залы по уникальному id
  const halls = allData.halls.filter(
    (h, idx, arr) => arr.findIndex(z => z.id === h.id) === idx
  );
  let seances = allData.seances.slice();

  // Фильмы для dnd — только фильмы!
  function renderFilmsList() {
    dndFilmsList.innerHTML = `<div class="fw-bold mb-2">Фильмы</div>`;
    films.forEach(film => {
      const filmEl = document.createElement('div');
      filmEl.className = 'dnd-film-item card mb-2 p-2 text-center';
      filmEl.draggable = true;
      filmEl.dataset.filmId = film.id;
      filmEl.innerHTML = `
        <img src="${film.film_poster}" alt="${film.film_name}" style="max-width:60px;max-height:60px;object-fit:cover;" class="mb-1">
        <div class="small">${film.film_name}</div>
      `;
      dndFilmsList.append(filmEl);
    });
  }

  // Таймлайн
  function renderTimelines() {
    dndTimelines.innerHTML = '';
    const totalMinutes = 16 * 60; // 08:00–24:00

    halls.forEach(hall => {
      const hallDiv = document.createElement('div');
      hallDiv.className = 'mb-4 p-2 dnd-hall-block';
      hallDiv.innerHTML = `<div class="fw-bold mb-2">${hall.hall_name}</div>`;
      const timeline = document.createElement('div');
      timeline.className = 'dnd-timeline';
      timeline.dataset.hallId = hall.id;
      timeline.style.position = 'relative';
      timeline.style.width = '100%';
      timeline.style.minWidth = '650px';

      // Временная шкала (08:00–23:00)
      for (let h = 8; h <= 23; h++) {
        const hourCell = document.createElement('div');
        hourCell.className = 'dnd-timeline-hour';
        hourCell.textContent = (h < 10 ? '0' : '') + h + ':00';
        hourCell.dataset.time = (h < 10 ? '0' : '') + h + ':00';
        timeline.append(hourCell);
      }

      // Сеансы этого зала (отрисовка после рендера таймлайна)
      setTimeout(() => {
        const timelineWidth = timeline.getBoundingClientRect().width;
        seances.filter(s => String(s.seance_hallid) === String(hall.id))
          .forEach(s => {
            const film = films.find(f => String(f.id) === String(s.seance_filmid));
            if (!film) return;
            const filmDuration = film.film_duration || 90;
            const [sh, sm] = s.seance_time.split(':').map(Number);
            const startMinutes = (sh - 8) * 60 + sm;
            const left = Math.round(startMinutes * timelineWidth / totalMinutes);
            const width = Math.max(60, Math.round(filmDuration * timelineWidth / totalMinutes));
            const seanceEl = document.createElement('div');
            seanceEl.className = 'dnd-seance card p-1 px-2';
            seanceEl.draggable = true;
            seanceEl.dataset.seanceId = s.id;
            seanceEl.dataset.filmId = s.seance_filmid;
            seanceEl.dataset.time = s.seance_time;
            seanceEl.style.position = 'absolute';
            seanceEl.style.top = '38px';
            seanceEl.style.left = left + 'px';
            seanceEl.style.width = width + 'px';
            seanceEl.style.minWidth = '80px';
            seanceEl.innerHTML = `
              <img src="${film.film_poster}" alt="" style="height:24px;width:24px;object-fit:cover;margin-right:4px;">
              <span class="small">${film.film_name}</span>
              <div class="fw-bold text-center" style="font-size:12px;">${s.seance_time}</div>
              <button type="button" class="btn-close btn-close-sm float-end ms-1 dnd-delete-seance" aria-label="Удалить"></button>
            `;
            timeline.append(seanceEl);
          });
      }, 0);

      hallDiv.append(timeline);
      dndTimelines.append(hallDiv);
    });
  }

  // DND logic
  let draggedFilmId = null;
  let draggedSeanceId = null;

  dndFilmsList.addEventListener('dragstart', e => {
    if (e.target.classList.contains('dnd-film-item')) {
      draggedFilmId = e.target.dataset.filmId;
      draggedSeanceId = null;
    }
  });
  dndTimelines.addEventListener('dragstart', e => {
    if (e.target.classList.contains('dnd-seance')) {
      draggedFilmId = e.target.dataset.filmId;
      draggedSeanceId = e.target.dataset.seanceId;
    }
  });

  dndTimelines.addEventListener('dragover', e => {
    if (e.target.classList.contains('dnd-timeline-hour') || e.target.classList.contains('dnd-timeline')) {
      e.preventDefault();
    }
  });

  dndTimelines.addEventListener('drop', async e => {
    const timeline = e.target.closest('.dnd-timeline');
    if (!timeline) return;
    const hallId = timeline.dataset.hallId;
    let hour = null;
    if (e.target.classList.contains('dnd-timeline-hour')) {
      hour = e.target.dataset.time;
    } else {
      return;
    }
    if (draggedFilmId && !draggedSeanceId) {
      // Проверка на пересечения
      const allData = await apiRequest('alldata');
      const film = allData.films.find(f => String(f.id) === String(draggedFilmId));
      const seancesInHall = allData.seances.filter(s => String(s.seance_hallid) === String(hallId));
      const filmDuration = film.film_duration || 90;
      const [h, m] = hour.split(':').map(Number);
      const startMinutes = (h - 8) * 60 + m;
      const endMinutes = startMinutes + filmDuration;

      const overlap = seancesInHall.some(s => {
        const sStart = parseInt(s.seance_time.split(':')[0]) * 60 + parseInt(s.seance_time.split(':')[1]);
        const sFilm = allData.films.find(f => f.id === s.seance_filmid);
        const sEnd = sStart + (sFilm ? sFilm.film_duration : 90);
        return (startMinutes < sEnd && endMinutes > sStart);
      });
      if (overlap) {
        alert('Пересечение по времени. Выберите другое время!');
        return;
      }
      // Добавляем новый сеанс
      const res = await apiRequest('seance', 'POST', {
        seanceHallid: hallId,
        seanceFilmid: draggedFilmId,
        seanceTime: hour
      });
      if (res) {
        alert('Сеанс добавлен!');
        window.location.reload();
      } else {
        alert('Ошибка добавления сеанса');
      }
    }
    draggedFilmId = null;
    draggedSeanceId = null;
  });

  // Кнопка удаления сеанса
  dndTimelines.addEventListener('click', async e => {
    if (e.target.classList.contains('dnd-delete-seance')) {
      const seanceId = e.target.closest('.dnd-seance').dataset.seanceId;
      if (seanceId && confirm('Удалить этот сеанс?')) {
        const res = await apiRequest(`seance/${seanceId}`, 'DELETE');
        if (res) {
          alert('Сеанс удалён');
          window.location.reload();
        } else {
          alert('Ошибка удаления');
        }
      }
    }
  });

  // Кнопка сохранить (по-прежнему просто уведомление)
  saveTimelineBtn.addEventListener('click', () => {
    alert('Расписание уже сохранено!');
  });

  renderFilmsList();
  renderTimelines();
}

});
