import 'dotenv/config';

async function fetchPRMetadata() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  // Prende il numero della PR dagli argomenti della riga di comando (default: 47)
  const prNumber = process.argv[2] || '47';
  const repo = 'InCampus-dev/InCampusApp';

  if (!GITHUB_TOKEN) {
    console.error('❌ ERRORE: La variabile GITHUB_TOKEN non è definita.');
    console.error('Assicurati di aver creato il file backend/.env e di aver inserito il tuo token.');
    process.exit(1);
  }

  console.log(`⏳ Recupero metadati della PR #${prNumber} dal repository ${repo}...`);

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Errore API GitHub (${response.status} ${response.statusText}):`, errorText);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('\n✅ PR Trovata!\n');
    console.log(`📌 Titolo: ${data.title}`);
    console.log(`👤 Autore: ${data.user.login}`);
    console.log(`🚦 Stato: ${data.state}`);
    console.log(`🔗 URL: ${data.html_url}`);
    console.log(`\n📝 Descrizione:\n${data.body || 'Nessuna descrizione.'}`);

  } catch (error) {
    console.error('❌ Si è verificato un errore di rete:', error);
  }
}

fetchPRMetadata();
