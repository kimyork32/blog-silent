const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const baseURL = 'https://silenthilltowncenter.com';

  // Función para extraer los enlaces de una página
  const extractLinksFromPage = async (pageNumber) => {
    const url = `${baseURL}/blog?kind=All&sort_bef_combine=created_DESC&sort_by=created&sort_order=DESC&page=${pageNumber}`;
    await page.goto(url);
    await page.waitForSelector('.view-content'); // Espera a que cargue el contenido

    // Extrae los enlaces únicos de cada bloque de la publicación
    const links = await page.evaluate(() => {
      const linkElements = document.querySelectorAll('.views-row'); // Selecciona todos los bloques de contenido
      const hrefs = new Set(); // Usamos un Set para garantizar enlaces únicos

      linkElements.forEach(block => {
        const link = block.querySelector('a'); // Solo se obtiene el primer enlace de cada bloque
        if (link) {
          const href = link.getAttribute('href');
          if (href.startsWith('/')) { // Asegurarse de que es una URL relativa
            hrefs.add(href); // Añade solo la URL relativa al Set
          }
        }
      });

      return Array.from(hrefs); // Convierte el Set a un array para devolverlo
    });

    return links; // Retorna solo los enlaces relativos
  };

  // Extrae los enlaces de las primeras 3 páginas
  const allLinks = [];
  for (let i = 0; i < 4; i++) {
    const links = await extractLinksFromPage(i);
    allLinks.push(...links); // Agrega los enlaces de cada página al array
  }

  // Función para extraer el contenido de cada artículo
  const extractContentFromPage = async (relativeUrl) => {
    const fullUrl = `${baseURL}${relativeUrl}`;
    await page.goto(fullUrl);
    const result = await page.evaluate(() => {
      const extractTitle = () => document.querySelector('.field-title')?.textContent.trim() || '';
      const extractAuthors = () => Array.from(document.querySelectorAll('.field-node-author')).map(author => author.textContent.trim());
      const extractCategories = () => Array.from(document.querySelectorAll('.field-category .field__item')).map(cat => cat.textContent.trim());

      const content = [];
      let firstImageAdded = false;
      let currentBlock = null;

      const article = document.querySelector('article');
      if (article) {
        article.querySelectorAll('h1, h2, h3, h4, h5, h6, p, img, ul, table').forEach(element => {
          if (element.tagName.toLowerCase() === 'img') {
            const figure = element.closest('figure');
            const caption = figure?.querySelector('figcaption')?.textContent.trim() || '';

            if (!firstImageAdded) {
              content.push({
                subtitle: null,
                typeSubtitle: null,
                image: element.src,
                imgcaption: null,
                paragraphs: [],
                table: null,
                list: null
              });
              firstImageAdded = true;
            } else {
              if (currentBlock) content.push(currentBlock);

              currentBlock = {
                subtitle: null,
                typeSubtitle: null,
                image: element.src,
                imgcaption: caption || null,
                paragraphs: [],
                table: null,
                list: null
              };
            }
          } else if (element.tagName.toLowerCase().startsWith('h')) {
            const subtitleText = element.textContent.trim();
            const tagType = element.tagName.toLowerCase();

            if (subtitleText === 'MENU') return;

            if (currentBlock) content.push(currentBlock);

            currentBlock = {
              subtitle: subtitleText,
              typeSubtitle: tagType,
              image: null,
              imgcaption: null,
              paragraphs: [],
              table: null,
              list: null
            };
          } else if (element.tagName.toLowerCase() === 'p') {
            const strongElements = element.querySelectorAll('strong');
            const hasOnlyStrong = strongElements.length === 1 && element.textContent.trim() === strongElements[0].textContent.trim();

            if (hasOnlyStrong) {
              const strongText = strongElements[0].textContent.trim();

              if (currentBlock) content.push(currentBlock);

              currentBlock = {
                subtitle: strongText,
                typeSubtitle: 'strong',
                image: null,
                imgcaption: null,
                paragraphs: [],
                table: null,
                list: null
              };
            } else {
              if (!currentBlock) {
                currentBlock = {
                  subtitle: null,
                  typeSubtitle: null,
                  image: null,
                  imgcaption: null,
                  paragraphs: [],
                  table: null,
                  list: null
                };
              }
              currentBlock.paragraphs.push(element.textContent.trim());
            }
          } else if (element.tagName.toLowerCase() === 'ul') {
            const listItems = [];
            element.querySelectorAll('li').forEach(li => {
              listItems.push(li.innerHTML.trim());
            });

            if (listItems.length > 0) {
              if (currentBlock) content.push(currentBlock);

              currentBlock = {
                subtitle: null,
                typeSubtitle: null,
                image: null,
                imgcaption: null,
                paragraphs: [],
                table: null,
                list: listItems
              };
            }
          } else if (element.tagName.toLowerCase() === 'table') {
            const tableData = [];
            const rows = element.querySelectorAll('tbody tr');
            rows.forEach(row => {
              const cells = row.querySelectorAll('td');
              if (cells.length === 2) {
                tableData.push({
                  NOMENCLATURA: cells[0].textContent.trim(),
                  'TIPO DE RELACIÓN': cells[1].textContent.trim()
                });
              }
            });

            if (tableData.length > 0) {
              if (!currentBlock) {
                currentBlock = {
                  subtitle: null,
                  typeSubtitle: null,
                  image: null,
                  imgcaption: null,
                  paragraphs: [],
                  table: tableData,
                  list: null
                };
              } else {
                currentBlock.table = tableData;
              }
            }
          }
        });

        if (currentBlock) content.push(currentBlock);
      }

      return {
        title: extractTitle(),
        authors: extractAuthors(),
        category: extractCategories(),
        content: content
      };
    });

    return result;
  };

  // Extrae el contenido de los enlaces obtenidos previamente
  const articlesData = [];
  for (let relativeUrl of allLinks) {
    const content = await extractContentFromPage(relativeUrl);
    // Elimina '/blog/' si está presente en el enlace
    relativeUrl = relativeUrl.replace('/blog/', '/'); // Reemplaza '/blog/' por '/'

    articlesData.push({
      url: relativeUrl, // Solo la URL relativa
      article: content  // El contenido de cada artículo
    });
  }

  // Guarda el resultado en un archivo JSON
  const outputFile = './scrapedArticles.json';
  fs.writeFileSync(outputFile, JSON.stringify(articlesData, null, 2));

  console.log(`Los datos fueron guardados en ${outputFile}`);

  // Cierra el navegador
  await browser.close();
})();
