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
let newsListContainer;
let loadingContainer;
let loginContainer, emailInput, passwordInput, loginButton, errorMessage;
let settingContainer, settingUserEmail, settingUsername, settingUserUID, changeUsernameButton, changePasswordButton;
let usernameModal, usernameModalClose, usernameModalInput, saveUsernameButton, usernameModalMessage;
let passwordModal, passwordModalClose, passwordModalCurrent, passwordModalNew, passwordModalConfirm, savePasswordButton, passwordModalMessage;

document.addEventListener('DOMContentLoaded', () => {
  // header - DOM
  userDataArea = document.getElementById('user-data');
  headerUsername = document.getElementById('header-username');
  logoutButton = document.getElementById('header-logout');
  //
  newsListContainer = document.getElementById('news-list-container');
  //
  loadingContainer = document.getElementById('loading-container');
  // before login - DOM
  loginContainer = document.getElementById('login-container');
  emailInput = document.getElementById('mail-address');
  passwordInput = document.getElementById('password');
  loginButton = document.getElementById('login-button');
  errorMessage = document.getElementById('error-message');
  // after login - DOM
  //   main
  settingContainer = document.getElementById('setting-container');
  settingUserEmail = document.getElementById('setting-email');
  settingUsername = document.getElementById('setting-username');
  settingUserUID = document.getElementById('setting-uid');
  changeUsernameButton = document.getElementById('change-username');
  changePasswordButton = document.getElementById('change-password');
  //   username modal
  usernameModal = document.getElementById('username-modal');
  usernameModalClose = document.getElementById('username-modal-close');
  usernameModalInput = document.getElementById('username-modal-input');
  saveUsernameButton = document.getElementById('save-username-button');
  usernameModalMessage = document.getElementById('username-modal-message');
  //   password modal
  passwordModal = document.getElementById('password-modal');
  passwordModalClose = document.getElementById('password-modal-close');
  passwordModalCurrent = document.getElementById('password-modal-current');
  passwordModalNew = document.getElementById('password-modal-new');
  passwordModalConfirm = document.getElementById('password-modal-confirm');
  savePasswordButton = document.getElementById('save-password-button');
  passwordModalMessage = document.getElementById('password-modal-message');

  // loadNews(q, listContainer);
  // header login - event listener
  if (logoutButton) logoutButton.addEventListener('click', handleLogout);
  // before login - event listener
  if (emailInput) emailInput.addEventListener('input', updateLoginButtonState);
  if (passwordInput) passwordInput.addEventListener('input', updateLoginButtonState);
  if (loginButton) loginButton.addEventListener('click', handleLogin);
  updateLoginButtonState();
  // after login - event listener
  if (changeUsernameButton) changeUsernameButton.addEventListener('click', openUsernameModal);
  if (changePasswordButton) changePasswordButton.addEventListener('click', openPasswordModal);
  
  if (usernameModalClose) usernameModalClose.addEventListener('click', closeUsernameModal);
  if (usernameModalInput) usernameModalInput.addEventListener('input', updateSaveUsernameButtonState);
  if (saveUsernameButton) saveUsernameButton.addEventListener('click', handleChangeUsername);
  
  if (passwordModalClose) passwordModalClose.addEventListener('click', closePasswordModal);
  if (passwordModalCurrent) passwordModalCurrent.addEventListener('input', updateSavePasswordButtonState);
  if (passwordModalNew) passwordModalNew.addEventListener('input', updateSavePasswordButtonState);
  if (passwordModalConfirm) passwordModalConfirm.addEventListener('input', updateSavePasswordButtonState);
  if (savePasswordButton) savePasswordButton.addEventListener('click', handleChangePassword);
});

onAuthStateChanged(auth, async (user) => {
  // console.log(window.location.href);
  loadingContainer.classList.add('hidden');
  const { db, doc, getDoc, collection, where, orderBy, limit, query, getDocs } = await getFirestoreAndFunctions(app);
  let isAdmin = false;
  if (user) {
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    // ログインボタンを無効化
    loginButton.disabled = true;
    loginButton.textContent = 'ログイン';
      
    loginContainer.classList.add('hidden');
    userDataArea.classList.remove('hidden');
    settingContainer.classList.remove('hidden');
      
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
    if (headerUsername && isAdmin) headerUsername.textContent = `[管理者]${username}`;
    if (settingUserEmail) settingUserEmail.textContent = user.email;
    if (settingUsername) settingUsername.textContent = username;
    if (settingUsername && isAdmin) settingUsername.textContent = `[管理者]${username}`;
    if (settingUserUID) settingUserUID.textContent = user.uid;
      
  } else {
    settingContainer.classList.add('hidden');
    userDataArea.classList.add('hidden');
    loginContainer.classList.remove('hidden');
  }
  let q;
  if (isAdmin) {
    q = query(
      collection(db, "AccountSettings", "root", "news"),
      orderBy("created_at", "desc"),
      limit(5)
    );
  } else {
    q = query(
      collection(db, "AccountSettings", "root", "news"),
      where("is_active", "==", true),
      orderBy("created_at", "desc"),
      limit(5)
    );
  }
  loadNews(q, newsListContainer, getDocs, isAdmin);
});

function updateLoginButtonState() {
  if (loginButton) { // loginButtonが存在する場合のみ実行
    // メールアドレスとパスワードの両方に値があるかチェック
    const hasEmail = emailInput && emailInput.value.trim() !== '';
    const hasPassword = passwordInput && passwordInput.value.trim() !== '';
    // 両方入力されていればボタンを有効、そうでなければ無効
    loginButton.disabled = !(hasEmail && hasPassword);
  }
}

function openUsernameModal() {
  if (usernameModal) usernameModal.classList.remove('hidden');
  
}
function closeUsernameModal() {
  if (usernameModal) usernameModal.classList.add('hidden');
  if (usernameModalInput) usernameModalInput.value = '';
  if (saveUsernameButton) saveUsernameButton.disabled = true;
  if (usernameModalMessage) usernameModalMessage.textContent = '';
}
function updateSaveUsernameButtonState() {
  if (saveUsernameButton) {
    const hasNewUsername = usernameModalInput && usernameModalInput.value.trim() !== '';
    saveUsernameButton.disabled = !hasNewUsername;
  }
}
const handleChangeUsername = async () => {
  const { db, doc, setDoc } = await getFirestoreAndFunctions();
  const newUsername = usernameModalInput.value.trim();
  usernameModalMessage.textContent = ''; // メッセージをクリア

  if (newUsername.length > 20) { //1～20文字の制限
    usernameModalMessage.style.color = 'red';
    usernameModalMessage.textContent = 'ユーザーネームは20文字以内で入力してください。';
    return;
  }
  if (saveUsernameButton) {
    saveUsernameButton.disabled = true;
    saveUsernameButton.textContent = '変更中...';
    usernameModalMessage.textContent = '';
  }
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("ユーザーがログインしていません。");
    // Firestoreの users/{UID} ドキュメントを更新
    const userProfileRef = doc(db, 'users', user.uid);
    await setDoc(userProfileRef, {
      username: newUsername,
    }, { merge: true }); // merge: true で既存フィールドを上書きせず、usernameだけ更新

    usernameModalMessage.style.color = '#09a318';
    usernameModalMessage.textContent = 'ユーザーネームが変更されました！';
    usernameModalInput.value = ''; // 入力フィールドをクリア
    saveUsernameButton.disabled = true;

    // ヘッダーのアカウント設定ボタンの表示も更新
    if (headerUsername) headerUsername.textContent = newUsername;
    if (settingUsername) settingUsername.textContent = newUsername;

  } catch (error) {
    console.error("ユーザーネーム変更エラー:", error);
    usernameModalMessage.style.color = 'red';
    usernameModalMessage.textContent = 'ユーザーネームの変更に失敗しました。' + error.message;
    saveUsernameButton.disabled = false;
  } finally {
    if (saveUsernameButton) {
      saveUsernameButton.textContent = '名前を変更';
    }
  }
};

function openPasswordModal() {
  if (passwordModal) passwordModal.classList.remove('hidden');
}
function closePasswordModal() {
  if (passwordModal) passwordModal.classList.add('hidden');
  //if (usernameModalInput) usernameModalInput.value = '';
  if (savePasswordButton) savePasswordButton.disabled = true;
  if (passwordModalMessage) passwordModalMessage.textContent = '';
}
function updateSavePasswordButtonState() {
  console.log(window.location.href);
  if (savePasswordButton) {
    const hasPasswordCurrent = passwordModalCurrent && passwordModalCurrent.value.trim() !== '';
    const hasPasswordNew = passwordModalNew && passwordModalNew.value.trim() !== '';
    const hasPasswordConfirm = passwordModalConfirm && passwordModalConfirm.value.trim() !== '';
    savePasswordButton.disabled = !(hasPasswordCurrent && hasPasswordNew && hasPasswordConfirm);
  }
}
const handleChangePassword = async () => {
  const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js");
  const currentPassword = passwordModalCurrent.value;
  const newPassword = passwordModalNew.value;
  const confirmNewPassword = passwordModalConfirm.value;
  passwordModalMessage.textContent = '';

  if (newPassword !== confirmNewPassword) {
    passwordModalMessage.textContent = '新しいパスワードが一致しません。';
    return;
  }
  if (newPassword.length < 6) {
    passwordModalMessage.textContent = '新しいパスワードは6文字以上である必要があります。';
    return;
  }
  if (currentPassword === newPassword) {
    passwordModalMessage.textContent = '現在のパスワードと同じパスワードは設定できません。';
    return;
  }

  if (savePasswordButton) {
      savePasswordButton.disabled = true;
      savePasswordButton.textContent = '変更中...';
  }

  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(
      user.email, // auth.currentUser.email ではなく user.email を使用
      currentPassword
    );
    // ここを修正: reauthenticateWithCredential(user, credential) 関数として呼び出す
    await reauthenticateWithCredential(user, credential);
    // ここを修正: updatePassword(user, newPassword) 関数として呼び出す
    await updatePassword(user, newPassword);

    passwordModalMessage.style.color = '#09a318';
    passwordModalMessage.textContent = 'パスワードが正常に変更されました！';
    passwordModalCurrent.value = '';
    passwordModalNew.value = '';
    passwordModalConfirm.value = '';
    savePasswordButton.disabled = true;
  } catch (error) {
    savePasswordButton.disabled = true;
    console.error("パスワード変更エラー:", error);
    passwordModalMessage.style.color = 'red';
    if (error.code === 'auth/wrong-password') {
      passwordModalMessage.textContent = '現在のパスワードが間違っています。';
    } else if (error.code === 'auth/invalid-credential') {
      passwordModalMessage.textContent = '提供された認証情報が無効です。パスワードを確認してください。';
    } else if (error.code === 'auth/requires-recent-login') {
      passwordModalMessage.textContent = 'セキュリティのため、もう一度ログインし直してからパスワードを変更してください。';
      await signOut(auth);
    } else {
      passwordModalMessage.textContent = 'パスワードの変更に失敗しました。' + error.message;
    }
  } finally {
    if (savePasswordButton) {
      savePasswordButton.textContent = 'パスワードを変更';
    }
  }
};


// ログイン処理
const handleLogin = async () => {
  const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js");
  errorMessage.textContent = ''; // エラーメッセージをクリア
  loginButton.disabled = true; // ボタンを無効化
  loginButton.textContent = 'ログイン中...'; // テキストで処理中であることを表示

  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    // ログイン成功後、onAuthStateChangedリスナーが次の処理を実行する。
  } catch (error) {
    errorMessage.textContent = 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
    console.error("ログインエラー:", error);
    loginButton.disabled = false;
    loginButton.textContent = 'ログイン';
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