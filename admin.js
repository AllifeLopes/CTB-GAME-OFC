const $ = id => document.getElementById(id);
const msg = (id, text) => { $(id).textContent = text; };
const configured = window.ctbFirebaseReady();
let db, auth, adminUid = null, unsubscribe = null, records = [];
if (!configured) { $('setup').classList.remove('hidden'); $('loginBox').classList.add('hidden'); }
else {
  db = firebase.firestore(); auth = firebase.auth();
  auth.onAuthStateChanged(async user => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    adminUid = null;
    $('panel').classList.add('hidden'); $('loginBox').classList.remove('hidden');
    if (!user) return;
    try {
      // Regras do Firestore bloqueiam qualquer usuário que não seja o UID administrador.
      await db.collection('questoes').limit(1).get();
      // Leitura pública não prova autorização; verificar documento restrito ao administrador.
      await db.collection('admin_access').doc('verify').get();
      adminUid = user.uid;
      $('loginBox').classList.add('hidden'); $('panel').classList.remove('hidden');
      $('adminIdentity').textContent = user.email;
      unsubscribe = db.collection('questoes').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        records = snapshot.docs.map(d => ({ id:d.id, ...d.data() })); render();
      }, err => msg('formMessage', 'Erro ao carregar: ' + err.message));
    } catch(e) { msg('loginMessage', 'Acesso negado: esta conta não é o administrador autorizado.'); await auth.signOut(); }
  });
  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault(); msg('loginMessage','Verificando acesso...');
    try { await auth.signInWithEmailAndPassword($('email').value.trim(), $('password').value); msg('loginMessage',''); $('password').value=''; }
    catch(e) { msg('loginMessage','Falha no login. Confira as credenciais e a configuração do Firebase.'); }
  });
  $('logout').onclick = () => auth.signOut();
  $('questionForm').addEventListener('submit', async e => {
    e.preventDefault(); if (!adminUid) return;
    $('save').disabled = true;
    const data = {text:$('text').value.trim(), answer:$('answer').value === 'true', explanation:$('explanation').value.trim(), subject:$('subject').value.trim()};
    if (!data.text || !data.explanation) { msg('formMessage','Preencha enunciado e justificativa.'); $('save').disabled=false; return; }
    try {
      const id = $('editId').value;
      if (id) await db.collection('questoes').doc(id).update(data);
      else await db.collection('questoes').add({...data,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      clearForm(); msg('formMessage','Questão salva com sucesso.');
    } catch(err) { msg('formMessage','Não foi possível salvar: '+err.message); }
    finally { $('save').disabled = false; }
  });
  $('cancel').onclick = clearForm;
}
function clearForm() { $('questionForm').reset(); $('editId').value=''; $('formTitle').textContent='Adicionar questão'; }
function render() {
  $('count').textContent = '('+records.length+')'; const list=$('list'); list.replaceChildren();
  for (const q of records) {
    const card=document.createElement('article'); card.className='item';
    const title=document.createElement('strong'); title.textContent=q.text;
    const desc=document.createElement('p'); desc.textContent=(q.answer?'CERTO':'ERRADO')+' • '+(q.subject||'Sem assunto')+' — '+(q.explanation||'');
    const edit=document.createElement('button'); edit.textContent='Editar'; edit.onclick=()=>{ $('editId').value=q.id; $('text').value=q.text; $('answer').value=String(q.answer); $('explanation').value=q.explanation||''; $('subject').value=q.subject||''; $('formTitle').textContent='Editar questão'; window.scrollTo({top:0,behavior:'smooth'}); };
    const del=document.createElement('button'); del.textContent='Excluir'; del.className='danger'; del.onclick=async()=>{ if (!confirm('Excluir esta questão?')) return; try {await db.collection('questoes').doc(q.id).delete();}catch(err){msg('formMessage',err.message);} };
    card.append(title,desc,edit,del); list.append(card);
  }
}
