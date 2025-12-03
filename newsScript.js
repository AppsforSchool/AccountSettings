import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyBaVboaz5qf3FnWybRgFmVQ20YHU9cq7T0",
  authDomain: "appsforschool-study.firebaseapp.com",
  projectId: "appsforschool-study",
  storageBucket: "appsforschool-study.firebasestorage.app",
  messagingSenderId: "740735293440",
  appId: "1:740735293440:web:39dfc03096bb5816ec60e5"
};

// 1. Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let firestoreFunctionsCache = null;
let dbCache = null;
async function getFirestoreAndFunctions(app) {
  if (dbCache && firestoreFunctionsCache) {
    return { 
      db: dbCache, 
      ...firestoreFunctionsCache 
    };
  }
  // Firestoreモジュールを動的にインポート
  const firestoreFunctions = await import(
    "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js"
  );
  const db = firestoreFunctions.getFirestore(app);
  // 結果をキャッシュに保存
  dbCache = db;
  firestoreFunctionsCache = firestoreFunctions; 
  return { 
    db: db, 
    ...firestoreFunctions 
  };
}

async function loadNews(q, listContainer, getDocs, isAdmin) {
  try {
    // getDocsの前に await を付けて、結果が返ってくるまで待機
    const snapshot = await getDocs(q);
    // データの取得が完了したので、読み込み中の表示をクリア
    listContainer.innerHTML = '';

    if (snapshot.empty) {
      listContainer.innerHTML = '<li>現在、お知らせはありません。</li>';
      return;
    }
    const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit', // 月を必ず2桁に
      day: '2-digit',   // 日を必ず2桁に
    });
    snapshot.forEach((doc) => {
      const data = doc.data();
      const listItem = document.createElement('li');
      // created_atがtimestamp型で、かつ存在する場合のみtoDate()を呼び出す
      const date = data.created_at ? dateFormatter.format(data.created_at.toDate()) : '????/??/??';
      // リンク先は newsDetail.html にドキュメントIDをハッシュとして付与
      listItem.innerHTML = `<p>${date} <a href="newsDetail.html#${doc.id}">${data.title}</a></p>`;
      if (isAdmin && !data.is_active) {
        listItem.innerHTML = `<p>${date} <a href="newsDetail.html#${doc.id}">${data.title}</a> [非公開]</p>`;
      }
      listContainer.appendChild(listItem);
    });
  } catch (error) {
    // エラーが発生した場合、ここで捕捉してコンソールに出力し、ユーザーに通知
    console.error("Firestoreからのお知らせ取得エラー:", error);
    listContainer.innerHTML = `<li>お知らせの読み込みに失敗しました。時間をおいて再度お試しください。<br>${error}</li>`;
    //listContainer.innerHTML = `<p>${error}</p>`;
  }
}


let userDataArea, headerUsername, logoutButton;
let addNewsModalButton, newsListContainer;
let addNewsModal, addNewsModalClose, addNewsModalTitleInput, addNewsModalBodyInput, addNewsModalTypeInput, addNewsModalActiveInput, addNewsButton, addNewsModalMessage;

document.addEventListener('DOMContentLoaded', () => {
  // header - DOM
  userDataArea = document.getElementById('user-data');
  headerUsername = document.getElementById('header-username');
  logoutButton = document.getElementById('header-logout');
  // news container - DOM
  addNewsModalButton = document.getElementById('add-news-modal-btn');
  newsListContainer = document.getElementById('news-list-container');
  //   add news modal
  addNewsModal = document.getElementById('add-news-modal');
  addNewsModalClose = document.getElementById('add-news-modal-close');
  addNewsModalTitleInput = document.getElementById('add-news-modal-title-input');
  addNewsModalBodyInput = document.getElementById('add-news-modal-body-input');
  addNewsModalTypeInput = document.getElementById('add-news-modal-type-input');
  addNewsModalActiveInput = document.getElementById('add-news-modal-active-input');
  addNewsButton = document.getElementById('add-news-button');
  addNewsModalMessage = document.getElementById('add-news-modal-message');

  // header login - event listener
  if (logoutButton) logoutButton.addEventListener('click', handleLogout);
  //
  if (addNewsModalButton) addNewsModalButton.addEventListener('click', openAddNewsModal);
  // add news modal - event listener
  if (addNewsModalClose) addNewsModalClose.addEventListener('click', closeAddNewsModal);
  if (addNewsModalTitleInput) addNewsModalTitleInput.addEventListener('input', updateAddNewsButtonState);
  if (addNewsModalBodyInput) addNewsModalBodyInput.addEventListener('input', updateAddNewsButtonState);
  if (addNewsButton) addNewsButton.addEventListener('click', addNews);
  
  /*onAuthStateChanged(auth, async (user) => {
    // console.log(window.location.href);
    userDataArea.classList.add('hidden');
    const { db, doc, getDoc, collection, where, orderBy, limit, query, getDocs } = await getFirestoreAndFunctions(app);
    let isAdmin = false;
    if (user) {
      userDataArea.classList.remove('hidden');
      
      const userProfileRef = doc(db, 'users', user.uid);
      const userProfileSnap = await getDoc(userProfileRef);
      let username = "no-data";
      if (userProfileSnap.exists()) {
        const profileData = userProfileSnap.data();
        if (profileData.username) {
          username = profileData.username;
        }
        if (profileData.isAdmin) {
          isAdmin = profileData.isAdmin || false;
        }
      }
      if (headerUsername) headerUsername.textContent = username;
      if (isAdmin) headerUsername.textContent = `[管理者]${username}`;
    } else {
      userDataArea.classList.add('hidden');
    }
    let q;
    if (isAdmin) {
      q = query(
        collection(db, "AccountSettings", "root", "news"),
        orderBy("created_at", "desc")
      );
      addNewsModalButton.classList.remove('hidden');
    } else {
      q = query(
        collection(db, "AccountSettings", "root", "news"),
        where("is_active", "==", true),
        orderBy("created_at", "desc")
      );
      addNewsModalButton.classList.add('hidden');
    }
    loadNews(q, newsListContainer, getDocs, isAdmin);
  });*/
});

onAuthStateChanged(auth, async (user) => {
  // console.log(window.location.href);
  userDataArea.classList.add('hidden');
  const { db, doc, getDoc, collection, where, orderBy, limit, query, getDocs } = await getFirestoreAndFunctions(app);
  let isAdmin = false;
  if (user) {
    userDataArea.classList.remove('hidden');
      
    const userProfileRef = doc(db, 'users', user.uid);
    const userProfileSnap = await getDoc(userProfileRef);
    let username = "no-data";
    if (userProfileSnap.exists()) {
      const profileData = userProfileSnap.data();
      if (profileData.username) {
        username = profileData.username;
      }
      if (profileData.isAdmin) {
        isAdmin = profileData.isAdmin || false;
      }
    }
    if (headerUsername) headerUsername.textContent = username;
    if (isAdmin) headerUsername.textContent = `[管理者]${username}`;
  } else {
    userDataArea.classList.add('hidden');
  }
  let q;
  if (isAdmin) {
    q = query(
      collection(db, "AccountSettings", "root", "news"),
      orderBy("created_at", "desc")
    );
    addNewsModalButton.classList.remove('hidden');
  } else {
    q = query(
      collection(db, "AccountSettings", "root", "news"),
      where("is_active", "==", true),
      orderBy("created_at", "desc")
    );
    addNewsModalButton.classList.add('hidden');
  }
  loadNews(q, newsListContainer, getDocs, isAdmin);
});

function openAddNewsModal() {
  if (addNewsModal) addNewsModal.classList.remove('hidden');
  
}
function closeAddNewsModal() {
  if (addNewsModal) addNewsModal.classList.add('hidden');
  if (addNewsModalTitleInput) addNewsModalTitleInput.value = '';
  if (addNewsModalBodyInput) addNewsModalBodyInput.value = '';
  if (addNewsModalTypeInput) addNewsModalTypeInput.value = 'new';
  if (addNewsModalActiveInput) addNewsModalActiveInput.value = 'false';
  updateAddNewsButtonState();
}

function updateAddNewsButtonState() {
  if (addNewsButton) {
    const hasTitle = addNewsModalTitleInput && addNewsModalTitleInput.value.trim() !== '';
    const hasBody = addNewsModalBodyInput && addNewsModalBodyInput.value.trim() !== '';
    addNewsButton.disabled = !(hasTitle && hasBody);
  }
}

const addNews = async () => {
  addNewsButton.disabled = true;
  addNewsButton.textCotent = '処理中...';
  const { db, serverTimestamp, addDoc, collection } = await getFirestoreAndFunctions(app);
  const title = addNewsModalTitleInput.value.trim();
  const body = addNewsModalBodyInput.value.trim();
  const type = addNewsModalTypeInput.value;
  const isActive = addNewsModalActiveInput.value === "true";
  try {
    const newsData = {
      title: title,
      body: body,
      type: type,
      is_active: isActive, // 公開状態を is_active フィールドにマッピング
      created_at: serverTimestamp(), // Firebaseサーバーの正確な日付
    };
    // Firestoreの 'news_AccountSettings' コレクションに新しいドキュメントを追加
    await addDoc(collection(db, "AccountSettings", "root", "news"), newsData);
    
    addNewsModalMessage.textContent = `新しいお知らせ（タイトル: ${title}）を追加しました！`;
    addNewsModalMessage.style.color = 'green';
    // フォームをリセット
    if (addNewsModalTitleInput) addNewsModalTitleInput.value = '';
    if (addNewsModalBodyInput) addNewsModalBodyInput.value = '';
    if (addNewsModalTypeInput) addNewsModalTypeInput.value = 'new';
    if (addNewsModalActiveInput) addNewsModalActiveInput.value = 'false';
    updateAddNewsButtonState();
    const { query, orderBy, getDocs } = await getFirestoreAndFunctions(app);
    const q = query(
      collection(db, "AccountSettings", "root", "news"),
      orderBy("created_at", "desc")
    );
    loadNews(q, newsListContainer, getDocs, true);
  } catch (error) {
    console.error("お知らせ追加エラー:", error);
    addNewsModalMessage.textContent = `追加に失敗しました: ${error.message}`;
    addNewsModalMessage.style.color = 'red';
  }
};

// ログアウト処理
const handleLogout = async () => {
  const { signOut } = await import("https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js");
  const isConfirmed = confirm('ログアウトしますか？');
  if (isConfirmed) {
    try {
      await signOut(auth);
      console.log("ログアウトしました！");
      alert("ログアウトしました。");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      alert("ログアウトに失敗しました。");
    }
  }
};