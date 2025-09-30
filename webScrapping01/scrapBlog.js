const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const url = 'https://silenthilltowncenter.com/blog/book-lost-memories-el-juicio/28';
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

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
