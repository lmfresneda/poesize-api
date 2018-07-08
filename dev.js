'use strict'

const Category = require('./src/models/category')
const CategoryPoe = require('./src/models/category-poe')
const Color = require('./src/models/color')
const User = require('./src/models/user')
const mongoose = require('mongoose')
// const id = mongoose.Types.ObjectId();

function getCategories() {
  return[
    new Category({ slug: 'motivation', description: 'Motivación' }),
    new Category({ slug: 'romantic', description: 'Romántico' }),
    new Category({ slug: 'poetry', description: 'Poesía' }),
    new Category({ slug: 'erotic', description: 'Erótico' }),
    new Category({ slug: 'funny', description: 'Divertido' }),
    new Category({ slug: 'comic', description: 'Cómico' }),
    new Category({ slug: 'youth', description: 'Juvenil' }),
    new Category({ slug: 'animals', description: 'Animales' }),
    new Category({ slug: 'nature', description: 'Naturaleza' }),
    new Category({ slug: 'love', description: 'Amor' }),
    new Category({ slug: 'clothes', description: 'Ropa' }),
    new Category({ slug: 'music', description: 'Música' }),
    new Category({ slug: 'movies', description: 'Películas' }),
    new Category({ slug: 'food', description: 'Comida' }),
    new Category({ slug: 'books', description: 'Libros' }),
    new Category({ slug: 'travel', description: 'Viajes' }),
    new Category({ slug: 'mascotas', description: 'Pets' }),
    new Category({ slug: 'apps', description: 'Apps' }),
    new Category({ slug: 'games', description: 'Games' }),
    new Category({ slug: 'family', description: 'Familia' }),
    new Category({ slug: 'coffee', description: 'Café' }),
    new Category({ slug: 'photography', description: 'Fotografía' }),
    new Category({ slug: 'news', description: 'Noticias' }),
    new Category({ slug: 'sports', description: 'Deportes' }),
    new Category({ slug: 'work', description: 'Trabajo' })
  ]
}
function getColors() {
  return [
    new Color({ color: 'rgb(250, 128, 114)', slug: 'salmon', description: 'salmon' }),
    new Color({ color: 'rgb(220, 20, 60)', slug: 'crimson', description: 'crimson' }),
    new Color({ color: 'rgb(255, 105, 180)', slug: 'hotpink', description: 'hotpink' }),
    new Color({ color: 'rgb(255, 99, 71)', slug: 'tomato', description: 'tomato' }),
    new Color({ color: 'rgb(255, 165, 0)', slug: 'orange', description: 'orange' }),
    new Color({ color: 'rgb(255, 228, 181)', slug: 'moccasin', description: 'moccasin' }),
    new Color({ color: 'rgb(240, 230, 140)', slug: 'khaki', description: 'khaki' }),
    new Color({ color: 'rgb(216, 191, 216)', slug: 'thistle', description: 'thistle' }),
    new Color({ color: 'rgb(218, 112, 214)', slug: 'orchid', description: 'orchid' }),
    new Color({ color: 'rgb(147, 112, 219)', slug: 'mediumpurple', description: 'mediumpurple' }),
    new Color({ color: 'rgb(72, 61, 139)', slug: 'darkslateblue', description: 'darkslateblue' }),
    new Color({ color: 'rgb(144, 238, 144)', slug: 'lightgreen', description: 'lightgreen' }),
    new Color({ color: 'rgb(60, 179, 113)', slug: 'mediumseagreen', description: 'mediumseagreen' }),
    new Color({ color: 'rgb(128, 128, 0)', slug: 'olive', description: 'olive' }),
    new Color({ color: 'rgb(0, 139, 139)', slug: 'darkcyan', description: 'darkcyan' }),
    new Color({ color: 'rgb(72, 209, 204)', slug: 'mediumturquoise', description: 'mediumturquoise' }),
    new Color({ color: 'rgb(70, 130, 180)', slug: 'steelblue', description: 'steelblue' }),
    new Color({ color: 'rgb(100, 149, 237)', slug: 'cornflowerblue', description: 'cornflowerblue' }),
    new Color({ color: 'rgb(210, 180, 140)', slug: 'tan', description: 'tan' }),
    new Color({ color: 'rgb(160, 82, 45)', slug: 'sienna', description: 'sienna' }),
    new Color({ color: 'rgb(255, 255, 255)', slug: 'white', description: 'white' }),
    new Color({ color: 'rgb(220, 220, 220)', slug: 'gainsboro', description: 'gainsboro' }),
    new Color({ color: 'rgb(47, 79, 79)', slug: 'darkslategray', description: 'darkslategray' }),
    new Color({ color: 'rgb(0, 0, 0)', slug: 'black', description: 'black' })
  ]
}
function getUsers(num) {
  const users = []
  for (let i = 0; i < num; i++) {
    users.push(new User({
      user: `poesize${i}`,
      email: `poesize${i}@poesize.com`,
      password: `poesize${i}`,
      lastLogin: Date.now(),
      acceptTermsConditions: true,
      bio: `Bio de usuario poesize${i}`,
      name: `Nombre poesize${i}`,
      followers_count: i * 2000,
      following_count: i
    }))
  }
  return users
}
function getCatPoes(catsSaved, num) {
  const catPoes = []
  catsSaved.forEach((cat, i) => {
    if (catPoes.length < num) {
      catPoes.push(new CategoryPoe({
        category: cat._id,
        poe: mongoose.Types.ObjectId(),
        times: [],
        times_count: i
      }))
    }
  })
  return catPoes
}

module.exports = async function dev() {
  // creamos categorías
  const categories = getCategories()
  // cremos colores
  const colors = getColors()
  // cremos usuarios
  const users = getUsers(20)

  // guardamos categorías
  const catsSaved = await Promise.all(categories.map(c => c.save()))
  // guardamos usuarios
  const usersSaved = await Promise.all(users.map(u => u.save()))

  // creamos poes
  const catPoes = getCatPoes(catsSaved, 20)

  // guardamos colores y catPoes
  await Promise.all([
    ...catPoes.map(c => c.save()),
    ...colors.map(c => c.save())
  ])

  console.log('*** Predata saved for development: ok ***')

  // guardamos categorías
  // Promise.all(categories.map(c => c.save())).then((catsSaved) => {
  //   // guardamos usuarios
  //   Promise.all(users.map(u => u.save())).then((usersSaved) => {
  //     const catPoes = []
  //     catsSaved.forEach((cat, i) => {
  //       if (catPoes.length < 20) {
  //         catPoes.push(new CategoryPoe({
  //           category: cat._id,
  //           poe: mongoose.Types.ObjectId(),
  //           times: [],
  //           times_count: i
  //         }))
  //       }
  //     })
  //     Promise.all([
  //       ...catPoes.map(c => c.save()),
  //       ...colors.map(c => c.save())
  //     ]).then(() => {
  //       console.log('*** Predata saved for development: ok ***')
  //     })
  //   })
  // })

}
