import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "1. Separate the motor system from the sensory system",
    blocks: [
      {"kind":"p","text":"Your gastrointestinal tract is an actively controlled muscular tube. Its smooth muscle contracts and relaxes to mix food, move contents forward, and temporarily store material. Circular muscle narrows a segment; longitudinal muscle changes its length. Enteric neurons—the nervous system embedded in the gut wall—coordinate these movements, with timing influenced by specialized pacemaker cells."},
      {"kind":"p","text":"Effective movement requires more than squeezing. In a simplified peristaltic reflex, contraction behind the contents works together with relaxation ahead of them. Strong contractions without appropriate downstream relaxation may move contents poorly. Conversely, coordinated movement need not involve particularly forceful contractions."},
      {"kind":"p","text":"Three properties therefore need separating. **Motility** is the pattern of movement. **Tone** is the background level of muscle activation. **Sensitivity** is how strongly the nervous system responds to events inside the organ. They interact, but they are not interchangeable."},
      {"kind":"p","text":"Someone can have vigorous contractions with little discomfort, ordinary contractions with considerable pain, or both disturbed contractions and heightened sensitivity. A persistent “clenched” feeling could also involve retained stool, impaired relaxation, or bracing of the abdominal skeletal muscles rather than sustained contraction of the intestine itself."},
      {"kind":"p","text":"The scientifically important distinction is that **felt tightness is an observation; excessive intestinal contraction is one possible explanation.** You cannot reliably infer the second from the first."},
    ],
  },
  {
    heading: "2. What visceral hypersensitivity actually means",
    blocks: [
      {"kind":"p","text":"“Visceral” refers to the internal organs. Visceral hypersensitivity means that stimulation of an organ produces discomfort or pain at a lower threshold, or a stronger response, than would typically be expected."},
      {"kind":"p","text":"Consider two people with a similar amount of intestinal distension after a meal. One notices mild fullness. The other experiences painful pressure or squeezing. Their intestines might be mechanically similar at that moment, but their sensory systems are responding differently."},
      {"kind":"p","text":"Two related pain concepts help clarify this. **Allodynia** means pain from an input that would ordinarily not be painful. **Hyperalgesia** means an exaggerated response to an input that is already painful. Visceral hypersensitivity can involve either pattern, although increased fullness, urgency, and discomfort also matter clinically."},
      {"kind":"p","text":"Hypersensitivity is not identical to **hypervigilance**, which means increased attention to bodily signals. A person may have heightened sensory responses without consciously monitoring the gut. Equally, intense monitoring can make an existing sensation more prominent. These processes can reinforce each other, but neither should automatically be assumed from the other."},
      {"kind":"p","text":"Crucially, hypersensitivity does not mean imaginary pain. It means that the relationship between bodily input and experienced sensation has changed."},
    ],
  },
  {
    heading: "3. The mechanics: volume is not pressure, and pressure is not pain",
    blocks: [
      {"kind":"p","text":"A common but incomplete explanation is: “There is too much gas, so the intestine hurts.” Gas can contribute, but its quantity alone does not explain the experience."},
      {"kind":"p","text":"One relevant property is **compliance**: how much an organ’s volume changes for a given change in pressure. A compliant region accommodates additional contents with a relatively small pressure increase. A less compliant region develops a larger pressure increase for the same added volume."},
      {"kind":"p","text":"Compliance depends on several things, including the tissue’s passive properties and active muscle tone. In the upper stomach, for example, normal accommodation allows a meal to enter without a large rise in pressure. Impaired accommodation can contribute to early fullness or discomfort, although this is not the explanation for every such symptom."},
      {"kind":"p","text":"Sensory endings respond to local deformation, wall tension, and chemical conditions—not simply to a running total of gas or food. Geometry matters too: the relationship between pressure and wall tension depends partly on the organ’s radius and wall structure."},
      {"kind":"p","text":"This creates two independent routes to discomfort. The gut may generate a larger mechanical stimulus because it accommodates contents poorly. Or the stimulus may be ordinary, but the nervous system may respond excessively. Both can occur together."},
      {"kind":"p","text":"The same distinction explains why **bloating and distension are not identical**. Bloating is a subjective feeling of pressure or enlargement. Distension is an observable increase in abdominal size. Either can occur without much of the other."},
    ],
  },
  {
    heading: "4. Where the sensory “gain” can increase",
    blocks: [
      {"kind":"p","text":"A useful engineering analogy is a sensor connected to an amplifier and a feedback controller. Pain can increase because the sensor becomes more responsive, because downstream circuits amplify its signal, because inhibitory control weakens, or because several changes occur together."},
      {"kind":"p","text":"**At the gut’s nerve endings**"},
      {"kind":"p","text":"Sensory nerves in and around the bowel wall detect mechanical and chemical events. Their responsiveness can change after infection, inflammation, or other biological disturbances."},
      {"kind":"p","text":"In some patients, local immune mediators—including histamine, prostaglandins, and proteases—can alter nerve excitability. Ion channels and receptors involved in detecting potentially threatening conditions may become easier to activate. Consequently, a previously tolerable amount of distension produces more neural activity."},
      {"kind":"p","text":"This is **peripheral sensitization**. It is one plausible mechanism in some forms of persistent gastrointestinal pain, including some post-infectious presentations. It does not establish that every person with gut pain has ongoing inflammation, an allergy, or a mast-cell disorder."},
      {"kind":"p","text":"**In the spinal cord**"},
      {"kind":"p","text":"Many intestinal pain-related signals enter the spinal cord through visceral sensory pathways. Spinal circuits are not passive wires: they can amplify, suppress, and combine incoming information."},
      {"kind":"p","text":"Repeated or sustained input can increase the responsiveness of these circuits. This is one form of **central sensitization**. More output may then be generated from a similar amount of incoming activity."},
      {"kind":"p","text":"Visceral and body-wall signals also converge on some shared spinal neurons. This helps explain why internal-organ pain can be poorly localized or referred to another region rather than felt as one precise point."},
      {"kind":"p","text":"**In brain networks and descending control**"},
      {"kind":"p","text":"Brain networks integrate incoming signals with attention, previous experience, expectations, emotional state, and the body’s current needs. Regions including the insula and anterior cingulate cortex contribute to aspects of internal-body awareness and the significance of discomfort."},
      {"kind":"p","text":"The brain also sends signals downward that can inhibit or facilitate pain processing. Sleep disruption, sustained stress, and repeated painful experiences can influence this regulation, although their importance varies between people."},
      {"kind":"p","text":"The vagus nerve participates in internal-state signaling and autonomic regulation, but it is not the sole pathway for gut pain. Many important pain pathways are spinal. Reducing the whole problem to “a dysregulated vagus” misses much of the biology."},
      {"kind":"p","text":"In an individual patient, it is often difficult to determine precisely how much amplification is peripheral versus central. **The mechanisms are real, but the symptom alone does not identify their location.**"},
    ],
  },
  {
    heading: "5. How tightening and hypersensitivity can form a feedback loop",
    blocks: [
      {"kind":"p","text":"Imagine that a meal produces ordinary intestinal expansion and contractions. A sensitized sensory system interprets those events as painful. Pain then increases arousal and draws attention toward the abdomen. The person may brace the abdominal wall, change breathing patterns, or become apprehensive about the next meal."},
      {"kind":"p","text":"Those responses can affect autonomic regulation, muscle activity, and subsequent sensory processing. The next intestinal event may therefore arrive in a system already primed to detect threat."},
      {"kind":"p","text":"The loop can also begin from the mechanical side. Constipation or impaired transit may increase distension and provoke painful contractions. Repeated pain can then contribute to heightened responsiveness, so improving stool retention may not immediately normalize every sensation."},
      {"kind":"p","text":"This is a **bidirectional feedback system**, not a simple story in which “anxiety causes stomach cramps.” Infection, altered bowel function, inflammation, stress, sleep disruption, and other factors can enter the loop at different points."},
      {"kind":"p","text":"Nor does the stress response simply squeeze the entire digestive tract. Its effects differ by region and circumstance. Stress can inhibit some motor functions while increasing certain colonic responses. A painful gut can therefore be slow, fast, poorly coordinated, or mechanically fairly normal."},
      {"kind":"p","text":"Sensitization also does not necessarily mean damaged nerves. It can reflect altered excitability and regulation—changes that may be modifiable rather than permanent."},
    ],
  },
  {
    heading: "6. How this relates to IBS and other conditions",
    blocks: [
      {"kind":"p","text":"Visceral hypersensitivity is an important mechanism in some **disorders of gut–brain interaction**, including irritable bowel syndrome and functional dyspepsia."},
      {"kind":"p","text":"IBS involves a characteristic pattern of recurrent abdominal pain associated with defecation or changes in stool frequency or form. Functional dyspepsia concerns upper-abdominal symptoms such as early satiation, post-meal fullness, or epigastric pain. Disturbed accommodation, motility, and sensory processing can contribute in different combinations."},
      {"kind":"p","text":"However, not everyone with IBS demonstrates hypersensitivity during laboratory testing, and hypersensitivity is not unique to IBS. It can also coexist with inflammatory or structural disease. It is therefore a mechanism to consider, not a substitute for diagnosis."},
      {"kind":"p","text":"In research and selected specialist settings, controlled balloon distension can help investigate responses to stretching. Routine clinical diagnosis usually relies more on the symptom pattern, examination, and appropriately targeted testing. There is no single routine test that cleanly measures a person’s overall “gut sensitivity.”"},
      {"kind":"p","text":"The word “functional,” when used clinically, should not be interpreted as “nothing is happening.” It generally distinguishes disturbances of operation and regulation from a readily demonstrable structural lesion. Altered neural signaling and muscle coordination are physiological events, even when an endoscopy looks normal."},
    ],
  },
  {
    heading: "7. Why treatment has to match the mechanism",
    blocks: [
      {"kind":"p","text":"The practical implication is that “relax the gut” is too vague to be a complete treatment strategy."},
      {"kind":"p","text":"If retained stool or another mechanical load is providing repeated stimulation, addressing that load matters. Depending on the situation, treatment may involve an appropriate constipation regimen, gradually introduced soluble fiber, or assessment for an evacuation problem. Simply suppressing contractions may be unhelpful if poor transit is already part of the problem."},
      {"kind":"p","text":"Dietary treatment can sometimes reduce the amount of stimulation. Certain carbohydrates increase intestinal water or fermentation, which can increase distension. A structured, time-limited low-FODMAP trial helps some people with IBS, but it should include reintroduction, ideally with dietitian guidance. A food provoking symptoms does not automatically mean it is damaging the bowel."},
      {"kind":"p","text":"Some antispasmodic medicines or enteric-coated peppermint oil help selected patients, but their effects and evidence vary. Some antispasmodics worsen constipation, and peppermint can aggravate reflux. More importantly, reducing muscle contraction does not necessarily correct sensory amplification."},
      {"kind":"p","text":"Treatments can also target pain processing. Clinician-selected neuromodulators, including low-dose tricyclic medicines in appropriate cases, can reduce IBS-related pain. Their use does not imply that the person is depressed; these medicines have effects on pain signaling and bowel function, and the bowel pattern matters when choosing them."},
      {"kind":"p","text":"Gut-directed cognitive behavioral therapy and hypnotherapy have evidence for improving IBS symptoms. They aim to change gut-related threat responses, attention, and symptom regulation—not to persuade someone that their pain is unreal."},
      {"kind":"p","text":"Sleep, regular activity, tolerable meal patterns, and techniques that reduce unnecessary abdominal bracing can support this work. Breathing exercises may help arousal or particular muscle patterns, but they do not mechanically “untie” the intestine or provide a universal nervous-system reset."},
      {"kind":"p","text":"**The treatment target is the combination of excessive input, disturbed movement, heightened sensitivity, and reinforcing feedback—not just one presumed spasm.**"},
    ],
  },
  {
    heading: "The take-home model",
    blocks: [
      {"kind":"p","text":"Think of the gut as **an active muscular organ coupled to an adaptive sensory-control system**. Its mechanics determine what signals are generated; peripheral and central processing influence how those signals are experienced; feedback can alter both."},
      {"kind":"p","text":"“Contracted” describes a motor interpretation or a feeling. “Hypersensitive” describes an altered response to stimulation. They can coexist, but neither proves the other."},
      {"kind":"p","text":"If this describes your own symptoms, new severe or worsening pain, a rigid abdomen, repeated vomiting, substantial bleeding or black stools, or marked swelling with inability to pass gas needs urgent assessment. Unexplained weight loss, anemia, or a persistent new symptom pattern also deserves medical evaluation rather than an automatic attribution to hypersensitivity."},
    ],
  },
];;
