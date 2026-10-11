const fs = require('fs');

let raw = fs.readFileSync('d:/Neevpvt/home_extracted.html', 'utf8');

// Find the start of the first section
const secStart = raw.indexOf('<section class="w-full bg-surface-warm border-b border-border-neutral');
let body = raw.slice(secStart);

// Remove </main> at the end if present
body = body.replace(/<\/main>[\s\S]*$/, '');

// Replace Google CDN image links with reliable construction photography
const imgMap = [
  [/https:\/\/lh3\.googleusercontent\.com\/aida\/AEtjO1WMHCf8Kyjf[^\"]+/g, 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80'],
  [/https:\/\/lh3\.googleusercontent\.com\/aida\/AEtjO1X_28Hom-oU[^\"]+/g, 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80'],
  [/https:\/\/lh3\.googleusercontent\.com\/aida\/AEtjO1UrZchhIySd[^\"]+/g, 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80'],
  [/https:\/\/lh3\.googleusercontent\.com\/aida\/AEtjO1XNDrkx6fAs[^\"]+/g, 'https://images.unsplash.com/photo-1558024920-b41e1887dc32?auto=format&fit=crop&w=1000&q=80'],
  [/https:\/\/lh3\.googleusercontent\.com\/aida\/AEtjO1V8tbzhsFoi[^\"]+/g, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80'],
  [/https:\/\/lh3\.googleusercontent\.com\/aida\/[^\"]+/g, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80']
];

imgMap.forEach(([regex, repl]) => {
  body = body.replace(regex, repl);
});

// Convert HTML to JSX
body = body.replace(/class="/g, 'className="');
body = body.replace(/for="/g, 'htmlFor="');
body = body.replace(/<!--\s*([\s\S]*?)\s*-->/g, '{/* $1 */}');
body = body.replace(/<img([^>]*[^\/])>/g, '<img$1 />');
body = body.replace(/<input([^>]*[^\/])>/g, '<input$1 />');
body = body.replace(/<br>/g, '<br />');
body = body.replace(/<br\s*>/g, '<br />');

// Clean inline event handlers like onsubmit="..."
body = body.replace(/onsubmit="[^"]*"/g, 'onSubmit={handleFormSubmit}');

fs.writeFileSync('d:/Neevpvt/home_body_jsx.txt', body);
console.log('Successfully prepared home_body_jsx.txt with length:', body.length);
