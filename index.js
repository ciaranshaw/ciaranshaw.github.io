const express = require('express');
const hbs = require('hbs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const app = express();

const ports = [80, 443];
const limit = 20;
const url = 'https://blog.ciaranfood.com';

const fetchBlogs = async (start = 0, responses = []) => {
  const promises = await Promise.all(
    new Array(limit)
      .fill(undefined)
      .map((_, index) =>
        new Promise((res, error) => {
          fetch(`${url}/${start + index}`)
            .then(async i => {
              const text = await i.text();
              const parsed = new JSDOM(text, "text/html");
              if (i.ok) {
                res({
                  title: parsed.window.document.title,
                  url: `${url}/${index}`
                });
              } else {
                res({});
              }
            })
        })
      )
  );

  if (promises[limit - 1].title) {
    return fetchBlogs(start + limit, [...responses, ...promises.filter(i => i.title)]);
  } else {
    return [...responses, ...promises.filter(i => i.title)];
  }
}

app.set('view engine', 'html');
app.engine('html', hbs.__express);
hbs.registerHelper('list', function (items, options) {        
  const itemsAsHtml = items.map(item => 
    `<li><a href="${url}/${item.index}">${item.title}</li>`
  );
  return `<ul>` + itemsAsHtml.join("\n") + "</ul>";
});


app.get('*', async (req, res) => {
  const responses = await fetchBlogs();
  res.render(__dirname + '/index.hbs', { blogs: responses });
});

ports.map(port =>
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  })
);
