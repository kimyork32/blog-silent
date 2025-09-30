const puppeteer = require('puppeteer');

(async () => {
  // Inicia un navegador en modo headless
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Dirígete a la URL base
  const baseURL = 'https://silenthilltowncenter.com';

  // Función para extraer los enlaces de una página
  const extractLinksFromPage = async (pageNumber) => {
    const url = `${baseURL}/blog?kind=All&sort_bef_combine=created_DESC&sort_by=created&sort_order=DESC&page=${pageNumber}`;
    await page.goto(url);
    await page.waitForSelector('.view-content');  // Espera a que cargue el contenido

    // Extrae los enlaces únicos de cada bloque de la publicación
    const links = await page.evaluate((baseURL) => {
      const linkElements = document.querySelectorAll('.views-row'); // Selecciona todos los bloques de contenido
      const hrefs = new Set();  // Usamos un Set para garantizar enlaces únicos
      
      linkElements.forEach(block => {
        const link = block.querySelector('a'); // Solo se obtiene el primer enlace de cada bloque
        if (link) {
          const href = link.getAttribute('href');
          const fullURL = href.startsWith('http') ? href : baseURL + href; // Combina la URL base si es relativa
          hrefs.add(fullURL);  // Añade el enlace al Set
        }
      });
      
      return Array.from(hrefs);  // Convierte el Set a un array para devolverlo
    }, baseURL);

    return {
      page: pageNumber,
      urls: links
    };
  };

  // Extrae los enlaces de las primeras 3 páginas
  const pagesData = [];
  for (let i = 0; i < 4; i++) {
    const data = await extractLinksFromPage(i);
    pagesData.push(data);
  }

  // Muestra los enlaces extraídos
  console.log(JSON.stringify(pagesData, null, 2));

  // Cierra el navegador
  await browser.close();
})();
