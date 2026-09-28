import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "The bug in the usual answer",
    blocks: [
      {"kind":"p","text":"Ask what skills survive AI and you'll get a familiar list: creativity, empathy, critical thinking, complex problem-solving. The list is not wrong so much as badly typed. It defines \"AI-proof\" by pointing at whatever the frontier can't do this year, which makes it a pointer to a moving address. A decade ago \"creativity\" meant painting and prose; then image and language models arrived and the word quietly retreated to mean something more rarefied. \"Coding\" sat on the safe list until it didn't. A definition that has to be patched every product cycle is a definition with the wrong shape."},
      {"kind":"p","text":"What we want instead is a definition that does not reference where the frontier currently is—one that would be just as true if the models were ten times weaker or ten times stronger. That requires a small piece of conceptual machinery, borrowed from mathematics and computer science, that turns out to fit the problem almost exactly. The machinery is recursion, and its useful cousin, the fixed point."},
    ],
  },
  {
    heading: "Recursion, briefly and precisely",
    blocks: [
      {"kind":"p","text":"A recursive definition defines a thing in terms of a smaller version of itself, plus a base case that stops the descent. The factorial of five is five times the factorial of four, and so on down, until you hit bottom: the factorial of zero is one. Two features matter for what follows. First, the same rule applies at every level—the rule doesn't change as you go up or down, only the size of the input does. Second, without a base case the definition isn't a definition at all; it's an infinite regress, the mathematical equivalent of a stack overflow."},
      {"kind":"p","text":"A fixed point is a related idea: an input that a process hands back unchanged. Press the cosine button on a calculator over and over and the display converges on 0.739…; press it again and nothing moves. A fixed point is where the transformation stops transforming."},
      {"kind":"p","text":"Now define the transformation we care about. Call it *absorption*. AI takes over a task when three conditions hold: the task's inputs and outputs can be represented in a medium the system handles; there's a signal—enough examples of the task done well, or a reliable way to check whether an attempt succeeded; and the task recurs often enough to be worth the setup. Notice what isn't in that definition: nothing about intelligence, creativity, or humanity. Painting was absorbed not because machines became artists but because a few billion captioned images existed and images can be tokenized. Coding is being absorbed because test suites are a signal and public repositories are scale. Representable, checkable, repeated: that's the menu, and over time nearly everything on it gets eaten."},
      {"kind":"p","text":"So the productive question is not \"what can't AI do?\" It's \"what does absorption hand back?\""},
    ],
  },
  {
    heading: "What absorption hands back",
    blocks: [
      {"kind":"p","text":"Take any task and let AI do it. Some work remains, and it always has the same shape. Someone has to decide the task should be done at all and what \"done\" means in this particular instance—call that *formulation*. Someone has to decide whether the output is acceptable, and how much scrutiny that decision deserves—call that *verification*. And someone has to be the entity whose name is attached to the outcome if it goes wrong—call that *ownership*. A small-business owner who hands copywriting to a model still has to know what the business is for, still has to read the draft and feel whether it sounds like her, and is still the one the customer will blame. A developer who hands a function to a model still has to say what the function is for, still has to decide whether the tests test the right thing, and is still the one who gets paged."},
      {"kind":"p","text":"So far this is the familiar \"move up a level\" advice. Here is where it becomes recursive. Apply absorption again, this time to the leftover work. Can AI help formulate? Yes: it can draft a specification, ask clarifying questions, propose three framings. Can AI help verify? Yes: it can write tests, critique its own output, flag inconsistencies. Can it help with ownership? It can generate audit trails and risk assessments. And what does that second round hand back? Someone has to decide whether the AI's specification is what they actually wanted. Someone has to decide whether to trust the AI's verification. Someone still answers for it."},
      {"kind":"p","text":"The leftover of the leftover has the same type as the leftover. Formulation, verification, and ownership are fixed points of the absorption operator: feed them through and they come out as themselves, one level up, with higher stakes and more leverage attached, but recognizably the same work. That is what \"recursive AI-proof\" means in a non-hand-wavy sense. These aren't skills the frontier hasn't reached yet. They're the residue of *any* frontier."},
      {"kind":"p","text":"They are also recursive in the plainer sense: each applies to itself. You can verify your own verification, ask whether you want what you want, and own the way you delegated ownership. Skills that can be turned on themselves are exactly the ones that don't run out of levels."},
    ],
  },
  {
    heading: "Why the recursion terminates in a person",
    blocks: [
      {"kind":"p","text":"A skeptic will say: keep going. Let the AI decide what it wants, verify itself, own the result. Why does this loop ever bottom out in a human?"},
      {"kind":"p","text":"Two reasons, and neither is about capability. The first is that wanting isn't a capability; it's a fact about who the system serves. A model can build an excellent representation of your preferences, but whether that representation is correct is a question only you can adjudicate, imperfectly, from the inside. The chain of \"is this what you meant?\" terminates in a subject who means things. The second is that trust is a relation between parties who bear consequences. A verification chain—this checks that, which checks the other—has to end in someone who says \"I accept this on my own judgment,\" and that acceptance is meaningful only because something happens to that someone if they're wrong. Consequences, legal and reputational and financial and moral, currently attach to people and to the institutions people build."},
      {"kind":"p","text":"Both of these are structural facts about how human society is arranged, not limits on what silicon can compute. That's precisely why they survive arbitrary increases in capability: they don't depend on the machine being unable to do something. They depend on humans remaining the *principals*—the ones on whose behalf the whole apparatus runs. If that assumption ever fails, career planning stops being the relevant frame. This lesson is written for the world in which it holds."},
    ],
  },
  {
    heading: "The base case, or why you can't skip the object level",
    blocks: [
      {"kind":"p","text":"Here is the part most \"focus on high-level skills\" advice gets wrong, and it's the part that makes the recursion honest rather than aspirational."},
      {"kind":"p","text":"Judgment is distilled from contact. A senior engineer's architectural taste is compressed from ten thousand bugs she personally chased. An editor's ear was trained on ten thousand sentences she personally had to fix. Verification is not a free-floating faculty you can exercise on outputs in a domain you've never worked in; you cannot grade essays in a language you cannot read. Formulation is worse: knowing what you want, precisely enough to specify it, usually requires having wanted the wrong thing several times and noticed."},
      {"kind":"p","text":"Machine learning has a tidy picture of this. In a generative adversarial network, a generator produces candidates and a discriminator learns to tell real from fake; each improves by pushing against the other. When you use AI as your generator, your role in the loop is discriminator. But discriminators only learn from exposure to ground truth—to real examples and real errors. If you never run the code, never read the primary source, never talk to the actual customer, your discriminator receives no gradient. It doesn't collapse dramatically; it plateaus, and then, as the generator improves, it gets outpaced—which from the inside feels like everything the AI produces being fine."},
      {"kind":"p","text":"This is the base case of the recursion. Formulation, verification, and ownership are fixed points only for someone who is still learning at the object level—still doing some of the work by hand, not because the output is better (it usually isn't) but because that is how the discriminator gets trained. Learning is itself a fixed point, arguably the one that keeps the other three honest: AI can accelerate nearly every part of it, the explaining and summarizing and quizzing, except the part where the model ends up in your head, which is the only part that counts. There's a real institutional version of this problem—if junior people never do detailed work, the pipeline that used to produce senior judgment quietly breaks—but the individual version is within your control. Keep a fraction of your work in hard mode, and book it as a training expense rather than a productivity loss."},
    ],
  },
  {
    heading: "Why the fixed points get more valuable, not merely safer",
    blocks: [
      {"kind":"p","text":"It would be enough if these skills were durable. They're better than durable. Economists distinguish substitutes from complements: when a substitute for you gets cheaper, demand for you falls; when a complement gets cheaper, demand for you rises. The value of a judgment call is roughly the quality of the decision times the magnitude of what the decision controls, and what AI does, more than anything, is increase that magnitude. One specification now steers thousands of lines of code; one editorial choice now shapes a campaign generated in an afternoon. Judgment is a complement to generative capability, and every improvement in the generator multiplies what the discriminator is worth."},
      {"kind":"p","text":"There's a Jevons-paradox flavor to this. When something becomes cheap, the world consumes far more of it. Cheap writing means more writing means more need for people who can tell which writing should exist. Cheap code means more code means a premium on the person who can say no. The bottleneck doesn't disappear; it migrates to the fixed points, and whoever stands there finds that the treadmill has become a ratchet."},
    ],
  },
  {
    heading: "A diagnostic you can run on any skill",
    blocks: [
      {"kind":"p","text":"The recursive framing gives you a test. Take any skill you're considering investing in and ask: if AI could do this outright, what would be left over, and does the leftover look like the original? If the leftover is nothing, the skill is a substitute and you are racing the frontier. If the leftover is something of a different kind—typesetting gave way to layout, which gave way to design, which is giving way to something else—the skill is a stepping stone, useful but temporary. If the leftover is the skill itself at a higher level of abstraction, you've found a fixed point."},
      {"kind":"p","text":"Run this on \"prompt engineering\" and watch it split. Translating intent into instructions is specifiable and checkable; it's already being absorbed. The intent itself is not. Run it on \"being creative\" and it splits the same way: generating variations is absorbed; deciding which variation is actually what the moment calls for, and defending that choice, is not. The diagnostic doesn't tell you what to learn. It tells you which part of what you're learning will still be yours."},
    ],
  },
  {
    heading: "Training the position",
    blocks: [
      {"kind":"p","text":"None of this is a personality trait; it's a set of habits, and habits are trainable."},
      {"kind":"p","text":"Write the acceptance criteria before you invoke the tool. If you can't articulate what a good result would look like, you are not delegating, you are gambling, and the effort of articulating it is exactly the formulation muscle. Before you read an output, write down what you expect it to say, then compare; this is the cheapest calibration training available, and over a few months it produces something rare—an accurate map of where the tool is reliable and where you are. Keep a hard-mode fraction, a deliberate share of your core work done unassisted, and think of it as paying for gradient. Make sure the verification chain touches reality somewhere, and make sure that somewhere is sometimes you: run the thing, read the source, ask the person. Put your name on decisions out loud, in writing, where it can be found later, because ownership is both a muscle and a reputation and both compound. Learn one domain deeply enough to have taste, not because that domain will last but because knowing what expertise feels like from the inside is the only reliable way to recognize its absence in yourself elsewhere. And practice asking, of your own conclusions, what evidence would change your mind—which is verification turned on the verifier."},
    ],
  },
  {
    heading: "Limits, stated plainly",
    blocks: [
      {"kind":"p","text":"This is an argument from structure, and structures can change. The fixed points hold as long as humans remain the principals for whom the work is done; they are social facts, not laws of physics. \"AI-proof\" is also relative: the claim is not immunity but position—being on the correct side of a bottleneck that is moving. And there is a distributional question this lesson does not resolve. Even if fixed-point roles exist, a given organization may end up with fewer of them than it once had people, or with far more people each commanding more leverage than any one person did before. Which of those worlds we get is not settled by the logic here."},
    ],
  },
  {
    heading: "The shape of the answer",
    blocks: [
      {"kind":"p","text":"The recursive AI-proof skill is not a skill; it's a position in a loop, and the loop runs at every level. The position belongs to whoever says what is wanted, whoever says whether this is it, and whoever answers for it—and it has to be re-earned each time the tools reach a new height, because the same three questions come back with bigger numbers attached. Recursion is a function that calls itself. The person who survives it is the one who keeps calling themselves back to those questions, and who never forgets that every recursion needs a base case, and the base case is the work you still do with your own hands."},
    ],
  },
];;
