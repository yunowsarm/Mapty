'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btEnter = document.querySelector('#enter');
const btClose = document.querySelector('#close');
const validinputs = (...inputs) => inputs.every(i => Number.isFinite(i));

class Workout {
  date = new Date();
  month = this.date.getMonth();
  day = this.date.getDate();
  id = (this.date.getTime() + '').slice(-10);
  type = inputType.value;
  clicks = 0;
  constructor(coodrs, distance, duration) {
    this.coodrs = coodrs;
    this.distance = distance;
    this.duration = duration;
  }
  click() {
    this.clicks++;
  }
}
class Running extends Workout {
  constructor(coodrs, distance, duration, cadence) {
    super(coodrs, distance, duration);
    this.cadence = cadence;
    this.CalPace();
  }
  CalPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(coodrs, distance, duration, elevationGain) {
    super(coodrs, distance, duration);
    this.elevationGain = elevationGain;
    this.CalSpeed();
  }
  CalSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapSize = 18;
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
    btEnter.addEventListener('click', this._newWorkout.bind(this));
    btClose.addEventListener('click', this._hideForm.bind(this));
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('error');
      }
    );
  }
  _loadMap(position) {
    // const {latitude}= position.coords
    // const {longitude}=position.coords
    // console.log(latitude,longitude)
    //从position中解构出经纬度
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapSize);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    if (!this.#workouts) return;
    this.#workouts.forEach(work => {
      this._renderWorkourMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    //get data from form
    const type = inputType.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevation = +inputElevation.value;
    let workout;
    //if workout running create running object
    if (type === 'running') {
      if (
        !validinputs(distance, duration, cadence) ||
        cadence <= 0 ||
        distance <= 0 ||
        duration <= 0
      ) {
        return alert('enter error data');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if workout cycling create cycling object
    if (type === 'cycling') {
      if (
        !validinputs(distance, duration, elevation) ||
        distance <= 0 ||
        duration <= 0 ||
        elevation <= 0
      ) {
        return alert('enter error data');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //add new object to array
    this.#workouts.push(workout);
    //Render workout on map as marker
    this._renderWorkourMarker(workout);
    //Render workout form
    this._renderWorkout(workout);
    //Hide form
    this._hideForm();
    //setlocal storage
    this._setLocalStorage();
  }
  _renderWorkourMarker(workout) {
    L.marker(workout.coodrs)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        } ${workout.type[0].toUpperCase()}${workout.type.slice(1)} on ${
          months[workout.month]
        } ${workout.day}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    const html = `
        <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.type[0].toUpperCase()}${workout.type.slice(
      1
    )} on ${months[workout.month]} ${workout.day}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              workout.type === 'running'
                ? workout.pace.toFixed(1)
                : workout.speed.toFixed(1)
            }</span>
            <span class="workout__unit">${
              workout.type === 'running' ? 'min/km' : 'km/h'
            }</span>
          </div>
          <div class="workout__details">
              <span class="workout__icon">${
                workout.type === 'running' ? '🦶🏼' : '⛰'
              }</span>
              <span class="workout__value">${
                workout.type === 'running'
                  ? workout.cadence
                  : workout.elevationGain
              }</span>
              <span class="workout__unit">${
                workout.type === 'running' ? 'spm' : 'm'
              }</span>
          </div>
        </li>
`;
    form.insertAdjacentHTML('afterend', html);
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 500);
  }
  _moveToWorkout(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coodrs, this.#mapSize, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // workout.click();
  }
  _setLocalStorage() {
    if (!localStorage) return;
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
