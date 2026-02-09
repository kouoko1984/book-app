const booklist = document.getElementById("book-list");
const book = document.getElementById("book");
const reason = document.getElementById("reason");
const stars = document.querySelectorAll("#stars span");
const addBtn = document.getElementById("add-Btn");

let rating = 0;
let books = [];
let editIndex = null;
let showOnlyLiked = false;

/* =========================
   localStorage 関連
========================= */

function saveBooks() {
    localStorage.setItem("books", JSON.stringify(books));
}

function loadBooks() {
    const stored = localStorage.getItem("books");
    if (stored) {
        books = JSON.parse(stored);
    }
}

/* =========================
   本を描画する関数
========================= */

function renderBooks() {
    booklist.innerHTML = "";

    const displayBooks = showOnlyLiked
        ? books.filter(b => b.liked)
        : books;

    displayBooks.forEach((bookData, index) => {


    const li = document.createElement("li");
    //もしpriceがnullやundefinedなら "価格情報なし"と表示
    const priceText = bookData.price ==="無料" ? "無料" : bookData.price ? `${bookData.price}` : "価格不明";

   
    li.innerHTML = `
        <img src="${bookData.image}" alt="表紙" style="width:80px; float:left; margin-right:10px;">
        <h3>${bookData.title}</h3>
        <p>${bookData.reason}</p>
        <p class="price" style="font-weight:bold; color:#d32f2f;">${priceText}</p>
        <p class="rate">${renderStars(bookData.star)}</p>
        <div class="actions">
            <button class="like-Btn">♡</button>
        </div>
        <div style="clear:both;">
        </div>
    `;

    /* ===== いいね機能 ===== */
    const likeBtn = li.querySelector(".like-Btn");
        if(bookData.liked) {
            likeBtn.textContent = "❤"
            likeBtn.classList.add("liked");
        }
 

    likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        bookData.liked = !bookData.liked;
        saveBooks();

        if (bookData.liked) {
            likeBtn.textContent = "❤";
            likeBtn.classList.add("liked", "bounce");
            setTimeout(() => likeBtn.classList.remove("bounce"), 400);
        } else {
            likeBtn.textContent = "♡";
            likeBtn.classList.remove("liked");
        }
    });

    /* ===== 削除ボタン ===== */
    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    li.appendChild(delBtn);

    delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        li.remove();
        books.splice(index, 1);
        saveBooks();
        renderBooks();
    });
    
    /* ===== 編集ボタン ===== */
    const edit = document.createElement("button");
    edit.textContent = "編集";
    li.appendChild(edit);

    edit.addEventListener("click", (e) => {
        e.stopPropagation();

        //既存データを入力欄へ戻す
        book.value = bookData.title;
        reason.value = bookData.reason;
        rating = bookData.star;

        stars.forEach((s, i) => {
            s.classList.toggle("active", i < rating);
        });

        editIndex = index;
        addBtn.textContent = "更新する";


    });

    /* ===== 完了トグル ===== */
    li.addEventListener("click", () => {
        li.classList.toggle("done");
    });

    booklist.prepend(li);
    });
}

/* =========================
   追加ボタン処理
========================= */

addBtn.addEventListener("click", async () => {
    const title = book.value.trim();
    const comment = reason.value.trim();

    if (title === "") return;

    let imageUrl = "https://dummyimage.com/100x150/cccccc/000000&text=No+Image";
    //ここにapiキーを貼り付ける
    let API_KEY = "";
    let price = "価格情報なし";//価格の初期値はなしにしておく

    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&key=${API_KEY}`
        );
        const data = await response.json();

        if (data.items && data.items.length > 0) {


            const targetItem = data.items.find(item =>
                item.volumeInfo.imageLinks && item.volumeInfo.imageLinks.thumbnail
            )   || data.items[0];
            const volumeInfo = targetItem.volumeInfo;
            const saleInfo = targetItem.saleInfo;//ここに価格情報がある可能性がある

            
            if(volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
                imageUrl = volumeInfo.imageLinks.thumbnail.replace("http://", "https://");
            }
            //価格の取得ロジック
            if(saleInfo) {
                if(saleInfo.listPrice && saleInfo.listPrice.amount) {
                    price = `￥${saleInfo.listPrice.amount}`;
                }else if(saleInfo.retailPrice && saleInfo.retailPrice.amount) {
                    price = `￥${saleInfo.retailPrice.amount}`;
                }else if(saleInfo.saleability === "FREE") {
                    price = "無料";
                }
            }
        }
    } catch (error) {
        console.error("通信エラー", error);
    }

    const bookData = {
        title,
        reason: comment,
        star: rating,
        image: imageUrl,
        price: price,
        liked: false
    };

    if (editIndex !== null) {
        //既存データ上書き（更新）
        books[editIndex] = bookData
        editIndex = null
        addBtn.textContent = "追加"
    } else {
        books.push(bookData);//新規追加
    }
    saveBooks();
    renderBooks();

    // 入力リセット
    book.value = "";
    reason.value = "";
    rating = 0;
    stars.forEach(s => s.classList.remove("active"));
});

/* =========================
   星評価
========================= */

stars.forEach((star, index) => {
    star.addEventListener("click", () => {
        rating = rating === index + 1 ? 0 : index + 1;

        star.classList.add("bounce");
        setTimeout(() => star.classList.remove("bounce"), 400);

        stars.forEach((s, i) => {
            s.classList.toggle("active", i < rating);
        });
    });
});

function renderStars(num) {
    let result = "";
    for (let i = 0; i < 5; i++) {
        result += i < num ? "★" : "☆";
    }
    return result;
}

const likeList = document.createElement("button")
likeList.textContent = "お気に入りのリスト";
document.body.prepend(likeList);
likeList.addEventListener("click", (e) => {
    showOnlyLiked = !showOnlyLiked;

    likeList.textContent = showOnlyLiked ? "すべての本に戻る":"お気に入りのリスト";

    renderBooks();
})

/* =========================
   初期読み込み
========================= */

loadBooks();
renderBooks();

