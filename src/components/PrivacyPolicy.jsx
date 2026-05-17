export default function PrivacyPolicy({ onClose }) {
  return (
    <div className="fullpage-overlay">
      <div className="fullpage-header">
        <button className="back-btn" onClick={onClose}>← Retour</button>
        <h1 className="fullpage-title">Politique de confidentialité</h1>
      </div>
      <div className="fullpage-body">
        <p className="privacy-updated">Dernière mise à jour : mai 2026</p>

        <section className="privacy-section">
          <h2>1. Qui sommes-nous ?</h2>
          <p>MoustiqueMap est une application collaborative de signalement de moustiques. Elle est développée à titre personnel et non commercial.</p>
        </section>

        <section className="privacy-section">
          <h2>2. Données collectées</h2>
          <h3>En mode anonyme</h3>
          <p>Un identifiant aléatoire est généré et stocké dans votre navigateur (localStorage). Aucune information personnelle n'est collectée. Vos signalements incluent uniquement :</p>
          <ul>
            <li>Votre position GPS approximative</li>
            <li>Le niveau d'infestation signalé</li>
            <li>La date et l'heure du signalement</li>
          </ul>

          <h3>Avec un compte</h3>
          <p>En créant un compte, vous nous fournissez :</p>
          <ul>
            <li>Votre adresse email (gérée exclusivement par Supabase Auth)</li>
            <li>Un pseudo, un prénom et un nom</li>
          </ul>
          <p>Votre mot de passe n'est jamais stocké en clair — il est géré intégralement par Supabase Auth avec chiffrement.</p>
        </section>

        <section className="privacy-section">
          <h2>3. Utilisation des données</h2>
          <p>Vos données sont utilisées uniquement pour :</p>
          <ul>
            <li>Afficher les signalements sur la carte</li>
            <li>Calculer et afficher vos badges</li>
            <li>Vous permettre de retrouver votre historique d'un appareil à l'autre</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Partage des données</h2>
          <p><strong>Vos données ne sont jamais vendues, louées ou partagées avec des tiers</strong> à des fins commerciales ou publicitaires.</p>
          <p>Les signalements géolocalisés sont affichés publiquement sur la carte mais ne contiennent aucune information personnelle identifiable.</p>
        </section>

        <section className="privacy-section">
          <h2>5. Hébergement</h2>
          <p>Les données sont hébergées sur <strong>Supabase</strong> (infrastructure AWS, région Europe). Supabase est conforme au RGPD.</p>
        </section>

        <section className="privacy-section">
          <h2>6. Vos droits (RGPD)</h2>
          <p>Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
            <li><strong>Droit de rectification</strong> : corriger vos informations</li>
            <li><strong>Droit à l'effacement</strong> : supprimer votre compte et vos données</li>
            <li><strong>Droit à la portabilité</strong> : exporter vos données</li>
          </ul>
          <p>Pour exercer ces droits, supprimez votre compte depuis la page Profil ou contactez-nous.</p>
        </section>

        <section className="privacy-section">
          <h2>7. Cookies et stockage local</h2>
          <p>Nous utilisons le localStorage de votre navigateur uniquement pour stocker votre identifiant anonyme et votre session de connexion. Aucun cookie publicitaire ou de tracking n'est utilisé.</p>
        </section>
      </div>
    </div>
  )
}
