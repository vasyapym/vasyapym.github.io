import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "Opening: Why This Pairing Is Strange",
    blocks: [
      {"kind":"p","text":"Say \"dopamine\" and most people think of the brain: reward, motivation, the thing your phone supposedly hijacks. Say \"irritable bowel syndrome\" and people think of the gut: cramps, bloating, urgency, bathroom anxiety. It seems odd to put them in the same lesson."},
      {"kind":"p","text":"But dopamine does not live only in the brain, and IBS is not only a gut disease. Some of the most interesting ideas in current gastroenterology sit where these two facts meet. This lesson builds that connection from the ground up. It assumes no background, but it won't dumb anything down."},
    ],
  },
  {
    heading: "Part 1: What Dopamine Actually Is",
    blocks: [
      {"kind":"p","text":"Dopamine is a small molecule called a **catecholamine**, chemically related to adrenaline (epinephrine) and noradrenaline (norepinephrine). Cells build it through a short assembly line:"},
      {"kind":"list","ordered":true,"items":["They start with **tyrosine**, an amino acid from your diet.","The enzyme **tyrosine hydroxylase** converts tyrosine into **L-DOPA**. This is the slow, rate-limiting step, the bottleneck that controls how much dopamine gets made.","A second enzyme, **aromatic L-amino acid decarboxylase**, converts L-DOPA into **dopamine**."]},
      {"kind":"p","text":"In some cells the line keeps going, turning dopamine into noradrenaline and then adrenaline. Dopamine is both a signal in its own right and a precursor to the body's stress hormones."},
      {"kind":"p","text":"**Receptors: the part that matters most**"},
      {"kind":"p","text":"A signaling molecule means nothing without a receiver. Dopamine acts through five receptor types, grouped into two families:"},
      {"kind":"list","items":["**D1-like receptors (D1, D5)** generally *stimulate* the cell's internal machinery. They couple to a protein called Gs, which raises levels of the messenger molecule cAMP.","**D2-like receptors (D2, D3, D4)** generally *inhibit* it. They couple to Gi, which lowers cAMP."]},
      {"kind":"p","text":"This gives the key conceptual point: **dopamine has no fixed \"meaning.\"** Its effect depends entirely on which receptor a given cell expresses. The same molecule can speed one process and brake another. When someone says \"dopamine does X,\" the right follow-up is: *acting on which receptor, in which tissue?*"},
      {"kind":"p","text":"**Busting the \"pleasure molecule\" myth**"},
      {"kind":"p","text":"In the brain, dopamine is less about pleasure and more about **salience and prediction**. Dopamine neurons fire strongly when something is *better than expected* and dip when something is *worse than expected*. This signal, called **reward prediction error**, is essentially a learning signal. Dopamine also helps the brain decide what deserves attention and effort. Keep this in mind, because it will matter when we get to pain and expectation in IBS."},
    ],
  },
  {
    heading: "Part 2: What IBS Actually Is",
    blocks: [
      {"kind":"p","text":"IBS is a **disorder of gut–brain interaction**, the current preferred term, replacing the older and somewhat dismissive \"functional disorder.\" It is diagnosed with the **Rome IV criteria**: recurrent abdominal pain linked to changes in bowel habits (frequency or stool form), with no structural or biochemical disease that explains the symptoms."},
      {"kind":"p","text":"Clinicians divide IBS into subtypes by dominant bowel pattern:"},
      {"kind":"list","items":["**IBS-C**: constipation-predominant","**IBS-D**: diarrhea-predominant","**IBS-M**: mixed","**IBS-U**: unclassified"]},
      {"kind":"p","text":"The defining feature isn't the bowel pattern, though. It's **pain**. Several interacting mechanisms are thought to drive IBS:"},
      {"kind":"list","items":["**Visceral hypersensitivity.** The gut's pain signaling is turned up, so normal amounts of gas or stretching register as painful.","**Altered motility.** Contractions are too fast, too slow, or poorly coordinated.","**Low-grade immune activation and increased gut permeability**, in some patients.","**Microbiome differences.**","**Post-infectious changes.** A significant minority of cases begin after a bout of gastroenteritis.","**Central processing differences.** The brain handles and interprets gut signals differently.","**Stress sensitivity**, running through the hypothalamic–pituitary–adrenal (HPA) axis and the autonomic nervous system."]},
      {"kind":"p","text":"A useful mental model is that IBS is a **dysregulated communication loop** between gut and brain, not a broken part in either one. That is exactly why a molecule that works on both ends of the loop is interesting."},
    ],
  },
  {
    heading: "Part 3: Dopamine in the Gut Itself",
    blocks: [
      {"kind":"p","text":"**The gut's own nervous system**"},
      {"kind":"p","text":"Your intestines contain the **enteric nervous system (ENS)**, a mesh of roughly 400–600 million neurons embedded in the gut wall. That is comparable to the spinal cord. The ENS can coordinate digestion even when disconnected from the brain, which is why it's sometimes called the \"second brain.\""},
      {"kind":"p","text":"Some enteric neurons make dopamine. Estimates based on measurements in the mesenteric organs suggest that **roughly half of the body's dopamine may be produced in the gastrointestinal region**. You'll often hear that about 90–95% of the body's serotonin is in the gut. Dopamine's gut story is less famous but real."},
      {"kind":"p","text":"One crucial detail: **dopamine does not cross the blood–brain barrier.** Gut dopamine and brain dopamine are separate pools. They communicate indirectly, through nerves like the vagus, immune signals, hormones, and microbial metabolites. They do not share molecules directly."},
      {"kind":"p","text":"**What dopamine does locally**"},
      {"kind":"p","text":"**1. Motility: dopamine as a brake.** The best-established gut role of dopamine is *inhibitory*. Acting mainly through **D2 receptors** on enteric neurons, dopamine reduces the release of **acetylcholine**, the main \"go\" signal for gut muscle contraction. Less acetylcholine means weaker, slower movement. Mouse studies that knock out D2 receptors or the dopamine transporter support dopamine's role as a physiological modulator of transit."},
      {"kind":"p","text":"The best clinical proof is pharmacological. **Domperidone** and **metoclopramide** block D2 receptors. Blocking the brake speeds things up, so these drugs are used as **prokinetics** to move the stomach along in conditions like gastroparesis."},
      {"kind":"p","text":"**2. Secretion and mucosal protection.** Dopamine influences fluid and electrolyte handling and helps protect the gut lining. In the duodenum, for example, it contributes to bicarbonate secretion, which buffers stomach acid. Parts of the kidney run on a similar dopamine system for sodium handling."},
      {"kind":"p","text":"**3. Blood flow.** Dopamine can dilate blood vessels in the gut. This is the reason it was once used in intensive care to try to protect abdominal organs, a practice that has since fallen out of favor."},
      {"kind":"p","text":"**4. Immune modulation.** Immune cells, including T cells and macrophages, express dopamine receptors. Dopamine can adjust inflammatory signaling, sometimes calming it and sometimes enhancing it depending on receptor and context. This matters because low-grade immune activation is a proposed IBS mechanism."},
      {"kind":"p","text":"**Connecting to IBS**"},
      {"kind":"p","text":"The logic is straightforward. If dopamine brakes motility and tunes secretion and immunity, then **imbalances in local dopamine signaling could plausibly contribute to motility-predominant IBS subtypes**. Too much braking fits constipation, and too little fits diarrhea."},
      {"kind":"p","text":"A careful caveat: this is a **mechanistically plausible hypothesis with supporting animal and indirect human data**. It is not yet an established cause of IBS. Serotonin has far more direct human IBS evidence and approved drugs targeting it (for example, 5-HT3 antagonists for IBS-D and 5-HT4 agonists for constipation). Dopamine is the understudied sibling."},
    ],
  },
  {
    heading: "Part 4: Dopamine in the Brain and the Pain of IBS",
    blocks: [
      {"kind":"p","text":"This is where things get conceptually rich."},
      {"kind":"p","text":"**Pain is constructed, not simply received**"},
      {"kind":"p","text":"Pain is not a raw readout of tissue damage. The brain *constructs* it by combining incoming signals with expectation, attention, emotion, and memory. In IBS, the incoming signals from the gut may be amplified, and the brain's interpretation of them may be amplified too."},
      {"kind":"p","text":"Dopamine enters here in three ways."},
      {"kind":"p","text":"**1. Pain modulation circuitry.** The brain's reward system, including the ventral tegmental area and nucleus accumbens (the **mesolimbic pathway**), interacts with pain-modulating regions. Dopamine signaling in these circuits can dampen pain perception. Relief from pain itself behaves like a reward and produces a prediction-error-like signal. Across chronic pain conditions, researchers have found evidence of altered dopamine function, and a common hypothesis is that chronic pain can involve a **blunted reward and pain-relief system**."},
      {"kind":"p","text":"**2. Expectation, anticipation, and hypervigilance.** Remember that dopamine encodes prediction and salience. Brain imaging studies in IBS have shown differences in how patients' brains respond to *anticipated* gut discomfort, not just actual stimulation. A brain that has learned \"my gut is a threat\" assigns high salience to gut sensations. That feeds a loop: attention amplifies the signal, the signal confirms the threat, and the threat increases attention. Dopamine-dependent salience and learning systems are natural candidates for part of this machinery, though the full picture involves many neurotransmitters."},
      {"kind":"p","text":"**3. The placebo effect.** IBS has one of the **highest placebo response rates in medicine**. Even open-label placebos, where patients know they're taking a sugar pill, have shown benefit in trials. Research on placebo analgesia more broadly links it to expectation of relief and activation of reward circuitry, including dopamine release in the striatum. This does not mean IBS is \"all in your head.\" It means the brain's expectation machinery is a *real, physiological* lever on symptoms, and dopamine is one of its gears."},
      {"kind":"p","text":"**Genetic hints**"},
      {"kind":"p","text":"The enzyme **COMT (catechol-O-methyltransferase)** breaks down dopamine and other catecholamines. A common variant, **Val158Met**, changes how fast it works. Some studies have linked COMT variants to IBS or to pain sensitivity more generally, but the findings are **inconsistent across populations**. Treat these as hints, not conclusions."},
    ],
  },
  {
    heading: "Part 5: The Microbial Angle",
    blocks: [
      {"kind":"p","text":"Gut bacteria don't just sit there. They take part in neurochemistry."},
      {"kind":"list","items":["Certain bacteria can **produce or modify catecholamines**. One well-studied example is ***Enterococcus faecalis***, which can convert L-DOPA into dopamine in the gut. This matters in Parkinson's disease, where L-DOPA is the main drug. Bacteria can intercept the drug before it reaches the brain. Another species, *Eggerthella lenta*, can further transform dopamine into other compounds.","Bacteria can also **respond to host catecholamines**. Some microbes change their growth or behavior when exposed to them, a field called **microbial endocrinology**."]},
      {"kind":"p","text":"For IBS, this opens a speculative but intriguing possibility: microbiome differences might shift local catecholamine levels, which would in turn affect motility, secretion, and immune signaling. It's an active research frontier, not settled science."},
    ],
  },
  {
    heading: "Part 6: A Revealing Neighbor, Parkinson's Disease",
    blocks: [
      {"kind":"p","text":"Parkinson's disease is defined by the loss of dopamine neurons in the brain. Yet **constipation often appears years, even decades, before motor symptoms**. The protein clump characteristic of Parkinson's, **alpha-synuclein**, can be found in the enteric nervous system. The **Braak hypothesis** proposes that in some patients the disease process may begin in the gut and travel to the brain, possibly via the vagus nerve."},
      {"kind":"p","text":"Some large epidemiological studies have reported an association between IBS and a later Parkinson's diagnosis. Association is not causation, however. Early, undiagnosed Parkinson's could simply produce gut symptoms that get labeled as IBS. Still, Parkinson's is strong proof that **dopamine-related disease can show up in the gut first**, which makes the gut–dopamine axis impossible to dismiss."},
    ],
  },
  {
    heading: "Part 7: Clinical Implications, Honestly Stated",
    blocks: [
      {"kind":"p","text":"What does this mean for treating IBS today?"},
      {"kind":"list","items":["**No approved IBS drug primarily targets dopamine.** Current mainstays include dietary approaches such as the low-FODMAP diet, fiber, antispasmodics, gut-directed drugs acting on serotonin, chloride channels, or guanylate cyclase, low-dose antidepressants used as \"neuromodulators,\" and gut-directed psychological therapies.","**D2 antagonists** like domperidone treat upper-gut motility problems but are not standard IBS treatments, and they carry cardiac and neurological risks.","**Psychological therapies** such as gut-directed hypnotherapy and CBT work surprisingly well for IBS. Part of their mechanism plausibly involves recalibrating the expectation, salience, and threat systems where dopamine operates.","**Drug side effects** are a useful clue. Medications that alter dopamine signaling frequently cause gut effects, a reminder that this system is active in the gut every day."]},
    ],
  },
  {
    heading: "Summary: The Big Picture",
    blocks: [
      {"kind":"list","items":["Enteric nervous system — D2-mediated brake on motility; modulates secretion and blood flow; IBS relevance: Plausible contributor to constipation or diarrhea patterns","Immune system — Tunes inflammatory signaling; IBS relevance: Links to low-grade inflammation in some IBS patients","Brain — Reward, prediction, salience, pain modulation; IBS relevance: Visceral hypersensitivity, hypervigilance, placebo response","Microbiome — Bacteria produce and modify catecholamines; IBS relevance: Speculative link between dysbiosis and symptoms","Genetics — COMT variants affect breakdown; IBS relevance: Inconsistent associations"]},
      {"kind":"p","text":"**The core takeaway:** IBS is a disorder of a communication loop, and dopamine is one of the few signals that works at nearly every node of that loop: gut wall, immune system, microbes, and brain. Serotonin remains the better-proven player in IBS. But dopamine's dual role, braking the gut locally while shaping expectation and pain centrally, makes it one of the most promising and underexplored angles in the field."},
      {"kind":"p","text":"**Mini-Glossary**"},
      {"kind":"list","items":["**Catecholamine**: a family of signaling molecules including dopamine, noradrenaline, and adrenaline.","**Enteric nervous system**: the gut's built-in neural network.","**Prokinetic**: a drug that speeds gut movement.","**Visceral hypersensitivity**: heightened pain sensitivity in internal organs.","**Reward prediction error**: the difference between expected and actual outcome, encoded by dopamine neurons.","**Rome IV**: the current diagnostic criteria for disorders of gut–brain interaction."]},
      {"kind":"p","text":"*Educational content only. If you have IBS symptoms, especially warning signs like weight loss, bleeding, nighttime symptoms, or onset after age 50, see a clinician.*"},
    ],
  },
];;
