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
    await page.waitForSelector('.view-content');  // Espera a que cargue el contenido

    // Extrae los enlaces únicos de cada bloque de la publicación
    const links = await page.evaluate((baseURL) => {
      const linkElements = document.querySelectorAll('.views-row'); // Selecciona todos los bloques de contenido
      const hrefs = new Set();  // Usamos un Set para garantizar enlaces únicos
      
      linkElements.forEach(block => {
        const link = block.querySelector('a'); // Solo se obtiene el primer enlace de cada bloque
        if (link) {
          // const href = link.getAttribute('href');
          // const fullURL = href.startsWith('http') ? href : baseURL + href; // Combina la URL base si es relativa
          // hrefs.add(fullURL);  // Añade el enlace al Set
          const href = link.getAttribute('href');
          if(href) {
            hrefs.add(href);  // Añade el enlace al Set
          }
        }
      });
      
      return Array.from(hrefs);  // Convierte el Set a un array para devolverlo
    // }, baseURL);
    });

    return links; // Retorna solo los enlaces
  };

  // Extrae los enlaces de las primeras 3 páginas
  const allLinks = [];
  let indice = 3;
  for (let i = indice; i < indice+1; i++) {  // Cambié el límite a 1 para obtener más datos, ajusta si es necesario
    const links = await extractLinksFromPage(i); // El número de página es i + 1
    allLinks.push(...links); // Agrega los enlaces de cada página al array
  }

  // Función para extraer el contenido de cada artículo
  const extractContentFromPage = async (url) => {
    await page.goto(url);
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
            // Procesar cada <li> dentro de <ul> como un objeto "list"
            const listItems = [];
            element.querySelectorAll('li').forEach(li => {
              listItems.push(li.innerHTML.trim()); // Guardar el contenido de <li> con tags HTML si es necesario
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
            // Procesar la tabla
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

            // Si encontramos una tabla, la agregamos al bloque actual
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

  // Función para limitar el contenido a las primeras 25 palabras
  const getFirst25Words = (contentArray) => {
    let words = [];
    for (let block of contentArray) {
      if (block.subtitle) words.push(...block.subtitle.split(' '));
      if (block.paragraphs) block.paragraphs.forEach(p => words.push(...p.split(' ')));

      if (words.length >= 25) {
        return words.slice(0, 25).join(' ') + '...';
      }
    }
    return words.join(' ') + '...'; // Si hay menos de 25 palabras
  };

  // Extrae el contenido de los enlaces obtenidos previamente
  const articlesData = [];
  for (let i = 0; i < allLinks.length; i++) {
    let relativeUrl = allLinks[i]; // Contendrá la ruta relativa directamente
    const content = await extractContentFromPage(baseURL + relativeUrl);
  
    // Elimina '/blog/' si está presente en el enlace
    relativeUrl = relativeUrl.replace('/blog/', '/'); // Reemplaza '/blog/' por '/'

    // Obtener las primeras 25 palabras del contenido
    const previousContent = getFirst25Words(content.content);
  
    articlesData.push({
      page: 4, // Asigna el número de página basándose en el índice del ciclo
      title: content.title,
      image: content.content.find(block => block.image)?.image || '',
      author: content.authors.join(', '),
      previousContent: previousContent,
      urlArticle: relativeUrl // Ya contiene la ruta relativa
    });
  }

  // Guarda el resultado en un archivo JSON
  const outputFile = './scrapedMainPage044.json';
  fs.writeFileSync(outputFile, JSON.stringify(articlesData, null, 2));

  console.log(`Los datos fueron guardados en ${outputFile}`);

  // Cierra el navegador
  await browser.close();
})();
