import { MigrationInterface, QueryRunner } from 'typeorm';

/** Seeds the ISO 45001:2018 checklist template (clauses 4-10) and the 4 default emergency scenarios. */
export class Phase4SeedChecklistAndScenarios1795280949200 implements MigrationInterface {
  name = 'Phase4SeedChecklistAndScenarios1795280949200';

  private readonly checklist: [string, string][] = [
    ['4.1', "Le contexte de l'organisme (enjeux internes et externes) est-il déterminé ?"],
    ['4.2', 'Les besoins et attentes des travailleurs et des autres parties intéressées sont-ils identifiés ?'],
    ['4.3', "Le périmètre du système de management de la santé et sécurité au travail (SMS-ST) est-il défini et documenté ?"],
    ['4.4', 'Le SMS-ST est-il établi, mis en œuvre, tenu à jour et amélioré en continu ?'],
    ['5.1', 'La direction démontre-t-elle son leadership et son engagement vis-à-vis du SMS-ST ?'],
    ['5.2', 'Une politique SST appropriée est-elle établie, documentée, communiquée et disponible ?'],
    ['5.3', 'Les rôles, responsabilités et autorités SST sont-ils attribués et communiqués ?'],
    ['5.4', 'La consultation et la participation des travailleurs sont-elles assurées ?'],
    ['6.1.1', 'Les risques et opportunités à traiter pour le SMS-ST sont-ils déterminés ?'],
    ['6.1.2', "Les dangers sont-ils identifiés et les risques SST évalués de manière continue et proactive ?"],
    ['6.1.3', 'Les exigences légales et autres exigences applicables sont-elles déterminées et tenues à jour ?'],
    ['6.2', 'Des objectifs SST mesurables sont-ils établis et planifiés pour être atteints ?'],
    ['7.1', 'Les ressources nécessaires au SMS-ST sont-elles déterminées et fournies ?'],
    ['7.2', 'La compétence des travailleurs (formation, expérience) est-elle assurée et enregistrée ?'],
    ['7.3', 'Les travailleurs sont-ils sensibilisés à la politique SST, aux dangers et aux conséquences d’une non-conformité ?'],
    ['7.4', 'Les processus de communication interne et externe relatifs au SMS-ST sont-ils établis ?'],
    ['7.5', 'Les informations documentées exigées sont-elles créées, maîtrisées et protégées ?'],
    ['8.1', 'Les processus opérationnels sont-ils planifiés et maîtrisés (hiérarchie des mesures de prévention, gestion du changement, achats, sous-traitants) ?'],
    ['8.2', "La préparation et la réponse aux situations d'urgence (plans, exercices, secours) sont-elles établies et testées ?"],
    ['9.1', "La performance SST est-elle surveillée, mesurée, analysée et évaluée (y compris la conformité légale) ?"],
    ['9.2', 'Des audits internes du SMS-ST sont-ils réalisés à intervalles planifiés ?'],
    ['9.3', 'La direction revoit-elle le SMS-ST à intervalles planifiés (revue de direction) ?'],
    ['10.2', 'Les incidents et non-conformités sont-ils traités, analysés (causes racines) et font-ils l’objet d’actions correctives ?'],
    ['10.3', "L'amélioration continue de la performance du SMS-ST est-elle démontrée ?"],
  ];

  private readonly scenarios = [
    {
      title: 'Incendie',
      type: 'fire',
      steps: [
        "Donner l'alerte : déclencher l'alarme incendie et prévenir la Protection civile (14 / 1021).",
        "Si vous êtes formé et que le feu est naissant, tenter de l'éteindre avec l'extincteur adapté sans prendre de risque.",
        'Couper les alimentations en énergie (électricité, gaz) si cela est possible en sécurité.',
        'Fermer les portes et fenêtres derrière vous pour limiter la propagation du feu et des fumées.',
        "Évacuer par les issues de secours balisées, sans utiliser l'ascenseur ; se baisser en cas de fumée.",
        'Se rendre au point de rassemblement et se faire pointer par le responsable d’évacuation.',
        "Ne pas retourner dans les locaux avant l'autorisation des secours.",
      ],
      contacts: [
        { name: 'Protection civile', role: 'Pompiers / secours', phone: '14 / 1021' },
        { name: 'SAMU', role: 'Urgences médicales', phone: '115' },
        { name: 'Responsable SST', role: 'Coordination interne', phone: '' },
      ],
    },
    {
      title: 'Évacuation',
      type: 'evacuation',
      steps: [
        "Dès le signal d'évacuation, arrêter immédiatement le travail et mettre les machines en sécurité.",
        'Laisser ses affaires personnelles et suivre les itinéraires d’évacuation balisés.',
        "Aider les personnes en difficulté ou à mobilité réduite ; ne pas utiliser l'ascenseur.",
        "Les guides et serre-files vérifient que les locaux sont vides avant de les quitter.",
        'Se rassembler au point de rassemblement, rester groupé par service et attendre le pointage.',
        "Signaler toute personne manquante au responsable d'évacuation ; ne pas rentrer avant l'autorisation.",
      ],
      contacts: [
        { name: 'Protection civile', role: 'Pompiers / secours', phone: '14 / 1021' },
        { name: 'Police secours', role: 'Sécurité publique', phone: '17 / 1548' },
        { name: 'Responsable SST', role: "Coordination de l'évacuation", phone: '' },
      ],
    },
    {
      title: 'Accident de travail / blessure',
      type: 'injury',
      steps: [
        "Protéger : sécuriser la zone et écarter le danger (couper la machine, balisage) sans s'exposer.",
        'Alerter : appeler le SAMU (115) ou la Protection civile (14 / 1021) et prévenir le responsable SST.',
        "Secourir : ne pas déplacer le blessé sauf danger immédiat ; pratiquer les gestes de premiers secours (sauveteur secouriste du travail).",
        "Utiliser la trousse de premiers secours et le défibrillateur si disponible.",
        "Rester auprès de la victime jusqu'à l'arrivée des secours et guider ceux-ci.",
        "Déclarer l'accident dans PROSAFE (incident) et conserver les éléments pour l'analyse des causes.",
      ],
      contacts: [
        { name: 'SAMU', role: 'Urgences médicales', phone: '115' },
        { name: 'Protection civile', role: 'Secours', phone: '14 / 1021' },
        { name: 'Responsable SST', role: 'Déclaration et suivi', phone: '' },
      ],
    },
    {
      title: 'Fuite de gaz',
      type: 'gas_leak',
      steps: [
        "Ne pas actionner d'interrupteur, ne pas utiliser de flamme ni de téléphone dans la zone (risque d'explosion).",
        "Fermer l'arrivée de gaz si cela est possible sans danger et ouvrir portes et fenêtres pour ventiler.",
        "Donner l'alerte depuis un endroit sûr : Protection civile (14 / 1021) et responsable SST.",
        'Évacuer immédiatement la zone et rejoindre le point de rassemblement, en vous éloignant du vent.',
        "Interdire l'accès à la zone et attendre l'intervention des secours et du service gaz.",
        "Ne rétablir l'énergie et ne ré-entrer qu'après autorisation des secours.",
      ],
      contacts: [
        { name: 'Protection civile', role: 'Pompiers / secours', phone: '14 / 1021' },
        { name: 'Gendarmerie nationale', role: 'Sécurité', phone: '1055' },
        { name: 'Police secours', role: 'Sécurité publique', phone: '17 / 1548' },
        { name: 'SAMU', role: 'Urgences médicales', phone: '115' },
      ],
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const items = this.checklist.map(([clause, question], i) => ({ id: i + 1, clause, question }));
    await queryRunner.query(
      `INSERT INTO "checklist_template" ("name", "standard", "items")
       SELECT $1::varchar, $2::varchar, $3::jsonb WHERE NOT EXISTS (SELECT 1 FROM "checklist_template" WHERE "name" = $1::varchar)`,
      ['ISO 45001:2018', 'ISO 45001', JSON.stringify(items)],
    );
    for (const s of this.scenarios) {
      await queryRunner.query(
        `INSERT INTO "emergency_scenario" ("title", "type", "steps", "contacts", "assemblyPoint", "isActive")
         SELECT $1::varchar, $2::"public"."emergency_scenario_type_enum", $3::jsonb, $4::jsonb, $5::varchar, true
         WHERE NOT EXISTS (SELECT 1 FROM "emergency_scenario" WHERE "title" = $1::varchar)`,
        [s.title, s.type, JSON.stringify(s.steps), JSON.stringify(s.contacts), 'Point de rassemblement principal'],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "emergency_scenario" WHERE "title" IN ($1, $2, $3, $4)`, this.scenarios.map((s) => s.title));
    await queryRunner.query(`DELETE FROM "checklist_template" WHERE "name" = $1`, ['ISO 45001:2018']);
  }
}
