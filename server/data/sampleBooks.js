/**
 * The sample catalog: 22 books with Open Library cover images.
 * addSampleBooks() only inserts the ones that are missing (matched by title and author, or by ISBN),
 * so it is safe to run again and it never changes or deletes books that are already there.
 */
const Book = require('../models/Book');

const cover = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

const SAMPLE_BOOKS = [
  ['To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Fiction', 'Harper Perennial', 1960, 4],
  ['1984', 'George Orwell', '9780451524935', 'Fiction', 'Signet Classic', 1949, 5],
  ['The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Literature', 'Scribner', 1925, 3],
  ['Pride and Prejudice', 'Jane Austen', '9780141439518', 'Literature', 'Penguin Classics', 1813, 2],
  ['Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '9780062316097', 'History', 'Harper', 2015, 3],
  ['A Brief History of Time', 'Stephen Hawking', '9780553380163', 'Science', 'Bantam', 1998, 2],
  ['Clean Code', 'Robert C. Martin', '9780132350884', 'Technology', 'Prentice Hall', 2008, 4],
  ['The Pragmatic Programmer', 'Andrew Hunt & David Thomas', '9780135957059', 'Technology', 'Addison-Wesley', 2019, 3],
  ["You Don't Know JS Yet", 'Kyle Simpson', '9798602477429', 'Technology', 'Independently published', 2020, 2],
  ['Atomic Habits', 'James Clear', '9780735211292', 'Self-Help', 'Avery', 2018, 5],
  ['The Diary of a Young Girl', 'Anne Frank', '9780553296983', 'Biography', 'Bantam', 1993, 2],
  ['Steve Jobs', 'Walter Isaacson', '9781451648539', 'Biography', 'Simon & Schuster', 2011, 1],
  ['Meditations', 'Marcus Aurelius', '9780812968255', 'Philosophy', 'Modern Library', 2002, 2],
  ["Sophie's World", 'Jostein Gaarder', '9780374530716', 'Philosophy', 'FSG', 2007, 2],
  ['The Little Prince', 'Antoine de Saint-Exupéry', '9780156012195', 'Children', 'Harcourt', 2000, 3],
  ["Harry Potter and the Sorcerer's Stone", 'J.K. Rowling', '9780590353427', 'Children', 'Scholastic', 1998, 6],
  ['The Joy of x', 'Steven Strogatz', '9780544105850', 'Mathematics', 'Mariner Books', 2013, 2],
  ['How Not to Be Wrong', 'Jordan Ellenberg', '9780143127536', 'Mathematics', 'Penguin', 2015, 1],
  ['Noli Me Tangere', 'José Rizal', '9780143039693', 'Literature', 'Penguin Classics', 2006, 4],
  ['Educated', 'Tara Westover', '9780399590504', 'Non-Fiction', 'Random House', 2018, 3],
  ['Thinking, Fast and Slow', 'Daniel Kahneman', '9780374533557', 'Non-Fiction', 'FSG', 2013, 2],
  ['Oxford Dictionary of English', 'Oxford Languages', '9780199571123', 'Reference', 'Oxford University Press', 2010, 1],
].map(([title, author, isbn, category, publisher, publishedYear, totalCopies], i) => ({
  title,
  author,
  isbn,
  category,
  publisher,
  publishedYear,
  totalCopies,
  availableCopies: totalCopies,
  coverImage: cover(isbn),
  shelfLocation: `${String.fromCharCode(65 + (i % 6))}-${10 + i}`,
  description: `${title} by ${author}. A ${category.toLowerCase()} title available at atLibrary.`,
}));

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const same = (text) => new RegExp(`^${escape(text)}$`, 'i');

const addSampleBooks = async () => {
  let added = 0;
  for (const book of SAMPLE_BOOKS) {
    const exists = await Book.exists({
      $or: [{ title: same(book.title), author: same(book.author) }, { isbn: book.isbn }],
    });
    if (exists) continue;
    await Book.create(book);
    added += 1;
  }
  return { added, total: SAMPLE_BOOKS.length };
};

module.exports = { SAMPLE_BOOKS, addSampleBooks };
