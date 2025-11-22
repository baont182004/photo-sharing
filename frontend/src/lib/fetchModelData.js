
const BASE_URL = 'http://localhost:3001';

function fetchModel(path, callback) {
  fetch(`${BASE_URL}${path}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      callback(data);
    })
    .catch((err) => {
      console.error('fetchModel error:', err);
    });
}

export default fetchModel;
