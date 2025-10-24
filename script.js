document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elementleri ---
    const homeView = document.getElementById('home-view');
    const bookDetailView = document.getElementById('book-detail-view');
    const bookGrid = document.getElementById('book-grid');
    const addBookBtn = document.getElementById('add-book-btn');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const modal = document.getElementById('modal');
    const closeModalBtn = document.getElementById('close-modal');
    const bookForm = document.getElementById('book-form');
    const bookNameInput = document.getElementById('book-name');
    
    // Ünite/Test Elementleri
    const addUnitBtn = document.getElementById('add-unit-btn');
    const unitAccordion = document.getElementById('unit-accordion'); 
    
    // Not Elementleri
    const notesList = document.getElementById('notes-list');
    const addNoteContainer = document.getElementById('add-note-container');

    let currentBookId = null; 

    // --- Görünüm Yönetimi ---
    const switchView = (view, bookId = null) => {
        homeView.classList.toggle('hidden', view !== 'home');
        bookDetailView.classList.toggle('hidden', view !== 'detail');
        currentBookId = bookId;
        
        if (view === 'home') {
            renderBooks();
        } else if (view === 'detail' && bookId) {
            loadBookDetails(bookId);
        }
    };

    // --- localStorage İşlevleri ---
    const getBooks = () => JSON.parse(localStorage.getItem('books')) || [];
    const saveBooks = (books) => localStorage.setItem('books', JSON.stringify(books));

    // --- Kitap Yönetimi (CRUD) ---
    const addBook = (name) => {
        const books = getBooks();
        const newBook = {
            id: Date.now().toString(),
            name,
            units: [], 
            notes: [] 
        };
        books.push(newBook);
        saveBooks(books);
        renderBooks();
    };

    const deleteBook = (id) => {
        if (!confirm('Bu kitabı ve tüm verilerini (ünite, test, not) silmek istediğinizden emin misiniz?')) return;
        const books = getBooks().filter(book => book.id !== id);
        saveBooks(books);
        switchView('home');
    };

    const renderBooks = () => {
        bookGrid.innerHTML = '';
        const books = getBooks();
        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML = `
                <h3>${book.name}</h3>
                <small>Ünite Sayısı: ${book.units.length}</small>
            `;
            
            card.onclick = (e) => {
                if (!e.target.classList.contains('delete-book-btn')) {
                    switchView('detail', book.id);
                }
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'X';
            deleteBtn.className = 'delete-book-btn';
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); 
                deleteBook(book.id);
            };
            card.appendChild(deleteBtn);

            bookGrid.appendChild(card);
        });
    };

    // --- Detay Sayfası Yükleme ---
    const loadBookDetails = (bookId) => {
        const books = getBooks();
        const book = books.find(b => b.id === bookId);
        if (!book) {
            switchView('home');
            return;
        }

        document.getElementById('book-title-detail').textContent = book.name;

        renderUnitsAccordion(book.units); 
        renderNotes(book.notes);
    };


    // --- Ünite ve Test Yönetimi (AKORDEON MANTIĞI) ---
    
    const renderUnitsAccordion = (units) => {
        unitAccordion.innerHTML = '';
        if (units.length === 0) {
             unitAccordion.innerHTML = '<p style="text-align:center; width:100%;">Henüz ünite eklenmemiş.</p>';
        }

        units.forEach(unit => {
            const item = document.createElement('div');
            item.className = 'accordion-item';
            item.dataset.unitId = unit.id;

            // 1. Akordeon Başlığı (Ünite)
            const header = document.createElement('div');
            header.className = 'accordion-header';
            header.innerHTML = `
                <span>${unit.name} (${unit.tests.length} Test)</span>
                <span class="chevron-icon">▼</span>
            `;
            header.onclick = () => toggleAccordion(item);
            item.appendChild(header);

            // 2. Akordeon İçeriği (Testler ve Test Ekle Butonu)
            const content = document.createElement('div');
            content.className = 'accordion-content';
            
            // Test Ekle Butonu
            const addButtonContainer = document.createElement('div');
            addButtonContainer.className = 'test-controls';
            const addTestBtn = document.createElement('button');
            addTestBtn.className = 'main-button';
            addTestBtn.textContent = '🧪 Test Ekle';
            addTestBtn.style.backgroundColor = 'var(--pastel-blue-dark)';
            addTestBtn.onclick = (e) => {
                e.stopPropagation(); 
                handleTestAdd(unit.id, unit.name);
            };
            addButtonContainer.appendChild(addTestBtn);
            content.appendChild(addButtonContainer);

            // Test Listesi Kapsayıcısı
            const testGrid = document.createElement('div');
            testGrid.className = 'test-grid';
            testGrid.id = `test-grid-${unit.id}`;
            content.appendChild(testGrid);

            item.appendChild(content);
            unitAccordion.appendChild(item);
            
            // İçerik yüklendiğinde testleri render et
            renderTests(unit.id, unit.tests); 
        });
    };
    
    const toggleAccordion = (item) => {
        const content = item.querySelector('.accordion-content');
        const header = item.querySelector('.accordion-header');
        const unitId = item.dataset.unitId;

        // Mevcut durumu kontrol et
        const isOpen = content.classList.contains('open');

        // Tüm akordeonları kapat
        document.querySelectorAll('.accordion-content.open').forEach(c => {
            c.classList.remove('open');
            c.previousElementSibling.classList.remove('active');
        });

        // Eğer kapalıysa, aç
        if (!isOpen) {
            content.classList.add('open');
            header.classList.add('active');
        }
    };
    
    const addUnit = (bookId, unitName) => {
        const books = getBooks();
        const bookIndex = books.findIndex(b => b.id === bookId);
        if (bookIndex === -1) return;

        const newUnit = {
            id: Date.now().toString(),
            name: unitName,
            tests: [] 
        };

        books[bookIndex].units.push(newUnit);
        saveBooks(books);
        renderUnitsAccordion(books[bookIndex].units);
    };

    const handleTestAdd = (unitId, unitName) => {
        const testName = prompt(`"${unitName}" ünitesi için Test adını girin:`);
        if (testName && testName.trim()) {
            addTest(currentBookId, unitId, testName.trim());
        }
    };
    
    const addTest = (bookId, unitId, testName) => {
        const books = getBooks();
        const bookIndex = books.findIndex(b => b.id === bookId);
        if (bookIndex === -1) return;

        const unitIndex = books[bookIndex].units.findIndex(u => u.id === unitId);
        if (unitIndex === -1) return;

        const newTest = {
            id: Date.now().toString(),
            name: testName,
            completed: false
        };

        books[bookIndex].units[unitIndex].tests.push(newTest);
        saveBooks(books);
        
        // Ünite listesini ve testleri yeniden render et
        loadBookDetails(bookId); 
        
        // Akordeonu açık tutmak için
        setTimeout(() => {
            const item = document.querySelector(`.accordion-item[data-unit-id="${unitId}"]`);
            if (item) {
                const content = item.querySelector('.accordion-content');
                const header = item.querySelector('.accordion-header');
                content.classList.add('open');
                header.classList.add('active');
            }
        }, 10);
    };


    // --- Test Listesini Render Etme ---
    const renderTests = (unitId, tests) => {
        const testGrid = document.getElementById(`test-grid-${unitId}`);
        if (!testGrid) return;
        
        testGrid.innerHTML = '';
        if (tests.length === 0) {
            testGrid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">Bu üniteye henüz test eklenmemiş.</p>';
            return;
        }

        tests.forEach(test => {
            const testCard = document.createElement('div');
            testCard.className = `test-card ${test.completed ? 'completed' : ''}`;
            testCard.textContent = test.name + (test.completed ? ' (✓)' : '');
            
            testCard.onclick = () => toggleTestCompletion(unitId, test.id);
            testGrid.appendChild(testCard);
        });
    };
    
    const toggleTestCompletion = (unitId, testId) => {
         const books = getBooks();
         const bookIndex = books.findIndex(b => b.id === currentBookId);
         const unitIndex = books[bookIndex].units.findIndex(u => u.id === unitId);
         const testIndex = books[bookIndex].units[unitIndex].tests.findIndex(t => t.id === testId);
         
         if (testIndex !== -1) {
             books[bookIndex].units[unitIndex].tests[testIndex].completed = 
                 !books[bookIndex].units[unitIndex].tests[testIndex].completed;
             
             saveBooks(books);
             renderTests(unitId, books[bookIndex].units[unitIndex].tests); 
             // Ünite başlığını test sayısı değiştiği için yenile (isteğe bağlı)
             document.querySelector(`.accordion-item[data-unit-id="${unitId}"] .accordion-header span:first-child`).textContent = 
                `${books[bookIndex].units[unitIndex].name} (${books[bookIndex].units[unitIndex].tests.length} Test)`;
         }
    };


    // --- Not Yönetimi ---
    
    const renderNotes = (notes) => {
        notesList.innerHTML = '';
        if (notes.length === 0) {
            notesList.innerHTML = '<p style="text-align:center; font-style:italic;">Henüz not yok. Artı ikonuna tıklayın.</p>';
            return;
        }

        notes.forEach(note => {
            const noteBar = document.createElement('div');
            noteBar.className = 'note-bar';
            noteBar.textContent = note.content; 
            noteBar.title = 'Tıkla ve Notu Sil/Düzenle';

            noteBar.onclick = () => {
                const action = confirm(`Notu silmek mi yoksa düzenlemek mi istiyorsunuz?\nTAMAM: Düzenle\nİPTAL: Sil`);
                if (action) {
                    editNote(note.id, note.content);
                } else {
                    deleteNote(note.id);
                }
            };
            
            notesList.appendChild(noteBar);
        });
    };
    
    const addNote = (bookId, content) => {
        const books = getBooks();
        const bookIndex = books.findIndex(b => b.id === bookId);
        if (bookIndex === -1) return;

        books[bookIndex].notes.push({ id: Date.now().toString(), content });
        saveBooks(books);
        renderNotes(books[bookIndex].notes);
    };
    
    const editNote = (noteId, currentContent) => {
         const newContent = prompt('Notu düzenle:', currentContent);
         if (!newContent || newContent.trim() === currentContent) return;
         
         const books = getBooks();
         const bookIndex = books.findIndex(b => b.id === currentBookId);
         if (bookIndex === -1) return;
         
         const noteIndex = books[bookIndex].notes.findIndex(n => n.id === noteId);
         if (noteIndex !== -1) {
             books[bookIndex].notes[noteIndex].content = newContent.trim();
             saveBooks(books);
             renderNotes(books[bookIndex].notes);
         }
    };
    
    const deleteNote = (noteId) => {
        if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return;
         
        const books = getBooks();
        const bookIndex = books.findIndex(b => b.id === currentBookId);
        if (bookIndex === -1) return;
        
        books[bookIndex].notes = books[bookIndex].notes.filter(n => n.id !== noteId);
        saveBooks(books);
        renderNotes(books[bookIndex].notes);
    };
    
    
    // --- Olay Dinleyicileri ---

    // Kitap Ekle Modal
    addBookBtn.addEventListener('click', () => {
        bookForm.reset();
        modal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));

    bookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const bookName = bookNameInput.value.trim();
        if (bookName) {
            addBook(bookName);
            modal.classList.add('hidden');
        }
    });

    backToHomeBtn.addEventListener('click', () => switchView('home'));


    // Yeni Ünite Ekle
    addUnitBtn.addEventListener('click', () => {
        if (!currentBookId) return alert('Önce bir kitap seçmelisiniz.');

        const unitName = prompt('Eklemek istediğiniz Ünitenin adını girin:');
        if (unitName && unitName.trim()) {
            addUnit(currentBookId, unitName.trim());
        }
    });

    // Not Ekle
    addNoteContainer.addEventListener('click', () => {
        if (!currentBookId) return alert('Önce bir kitap seçmelisiniz.');

        const content = prompt('Yeni notunuzu girin:');
        if (content && content.trim()) {
            addNote(currentBookId, content.trim());
        }
    });

    // Başlangıçta kitapları yükle
    renderBooks();
});