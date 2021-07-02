let versionSelect, colorSelect;

Office.onReady((info) => {
  versionSelect = document.getElementById("version");
  colorSelect = document.getElementById("color");
  if (info.host === Office.HostType.Word) {
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";
    document.getElementById("run").onclick = () => tryCatch(setup);
  }
  var DropdownHTMLElements = document.querySelectorAll('.ms-Dropdown');
  for (var i = 0; i < DropdownHTMLElements.length; ++i) {
    new fabric['Dropdown'](DropdownHTMLElements[i]);
  }
});

var book_string =
  "Genesis|Gen?|Gn|Exodus|Exod?|Ex|Leviticus|Le?v|Numbers|Nu?m|Nu|Deuteronomy|Deut?|Dt|Josh?ua|Josh?|Jsh|Judges|Ju?dg|Jg|Ru(?:th)?|Ru?t|(?:1|i|2|ii) ?Samuel|(?:1|i|2|ii) ?S(?:a|m)|(?:1|i|2|ii) ?Sam|(?:1|i|2|ii) ?Kin(?:gs?)?|(?:1|i|2|ii) ?Kgs|(?:1|i|2|ii) ?Chronicles|(?:1|i|2|ii) ?Chr(?:o?n)?|(?:1|i|2|ii) ?Cr|Ezra?|Nehemiah|Neh?|Esther|Esth?|Jo?b|Psalms?|Psa?|Proverbs|Pro?v?|Ecclesiastes|Ec(?:cl?)?|Song (?:O|o)f Solomon|Song (?:O|o)f Songs?|Son(?:gs?)?|SS|Isaiah?|Isa?|Jeremiah|Je?r|Lamentations|La(?:me?)?|Ezekiel|Eze?k?|Daniel|Da?n|Da|Hosea|Hos?|Hs|Jo(?:el?)?|Am(?:os?)?|Obadiah|Ob(?:ad?)?|Jon(?:ah?)?|Jnh|Mic(?:ah?)?|Mi|Nah?um|Nah?|Habakkuk|Hab|Zephaniah|Ze?ph?|Haggai|Hagg?|Hg|Zechariah|Ze?ch?|Malachi|Ma?l|Matthew|Matt?|Mt|Mark|Ma(?:r|k)|M(?:r|k)|Luke?|Lk|Lu?c|John|Jn|Ac(?:ts?)?|Romans|Ro?m|(?:1|i|2|ii) ?Corinthians|(?:1|i|2|ii) ?C(?:or?)?|Galatians|Gal?|Gl|Ephesians|Eph?|Philippians|Phil|Colossians|Co?l|(?:1|i|2|ii) ?Thessalonians|(?:1|i|2|ii) ?Th(?:e(?:ss?)?)?|(?:1|i|2|ii) ?Timothy|(?:1|i|2|ii) ?Tim|(?:1|i|2|ii) ?T(?:i|m)|Ti(?:tus)?|Ti?t|Philemon|Phl?m|Hebrews|Heb?|Jam(?:es)?|Jms|Jas|(?:1|i|2|ii) ?Peter|(?:1|i|2|ii) ?Pe?t?|(?:1|i|2|ii|3|iii) ?J(?:oh)?n?|Jude?|Revelations?|Rev|R(?:e|v)";

var apoc_books =
  "|Tobit?|To?b|Judi(?:th?)?|Jdt|(?:1|2) ?Mac(?:cabees)?|(?:1|2) ?Ma?|Wi(?:sdom)?|Wi?s|Sir(?:ach)?|Ba(?:ruc?h)?|Ba?r";

var unicode_space = "[\\u0020\\u00a0\\u1680\\u2000-\\u200a\\u2028-\\u202f\\u205f\\u3000]";
//finds book and chapter for each verse that been separated by &,and,etc...
var book_chap =
  "((?:(" +
  book_string +
  ")(?:.)?" +
  unicode_space +
  "*?)?(?:(\\d*):)?(\\d+(?:(?:ff|f|\\w)|(?:\\s?(?:-|–|—)\\s?\\d+)?)))([^a-z0-9]*)";
var regex_string =
  "(?:" +
  book_string +
  ")(?:.)?" +
  unicode_space +
  "*?\\d+:\\d+(?:ff|f|\\w)?(?:\\s?(?:(?:(?:-|–|—)\\s?(?:(?:" +
  book_string +
  ")(?:.)?\\s)?)|(?:(?:,|;|&amp;|&|and|cf\\.|cf)))\\s?(?:(?:(?:vv.|vs.|vss.|v.) ?)?\\d+\\w?)(?::\\d+\\w?)?)*";

const regex = new RegExp(regex_string, "ig");
const book_chap_regex = new RegExp(book_chap, "gi");

const setup = async () => {
  await Word.run(async (context) => {
    try {
      context.document.body.paragraphs.load("items");
      await context.sync();
      const paragraphs = context.document.body.paragraphs.items;

      for (let paragraph of paragraphs) {
        const item_string = paragraph.text.toString();

        var verse_match = item_string.match(regex);
        if (verse_match == null) {
          continue;
        } else {
          let matched, book, chapter, verse;

          for (let verse_matched of verse_match) {
            while ((matched = book_chap_regex.exec(verse_matched))) {
              try {
                if (matched[2] != "" && matched[2] != null) {
                  book = matched[2];
                }
                if (matched[3] != "" && matched[3] != null) {
                  chapter = matched[3];
                }
                verse = matched[4];
                var passage = book + " " + chapter + ":" + verse;

                const hyperlink = `https://www.biblegateway.com/passage/?search=${passage}&version=${versionSelect.value}&src=tools`;

                const SearchItems = paragraph.search(matched[0]);
                SearchItems.load("items");
                await paragraph.context.sync();
                SearchItems.items[0].hyperlink = hyperlink;
                SearchItems.items[0].font.color = colorSelect.value;
              } catch (err) {
                console.log(matched[0]);
                console.log(err);
              }
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  });
};

/** Default helper for invoking an action and handling errors. */
async function tryCatch(callback) {
  try {
    await callback();
  } catch (error) {
    // Note: In a production add-in, you'd want to notify the user through your add-in's UI.
    console.error(error);
  }
}
