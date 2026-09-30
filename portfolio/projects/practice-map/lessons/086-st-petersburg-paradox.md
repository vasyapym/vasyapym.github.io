<!-- lesson-meta: {"practicePrompt":"Rebuild the calculation for yourself: write the payout schedule, the infinite series, and where it breaks the expectation rule; then walk the five resolutions and name, for each, one game it fails to fix.","checkPrompt":"Be able, without notes, to derive the paradox in three lines; explain why diminishing marginal utility rescues intuition but not the bet; what the ensemble-vs-time-average argument actually claims; and why the paradox still matters."} -->
<!-- lesson-theory: {"problem":"Expected value is the first tool of probability, and the paradox breaks it in front of your eyes — a game of no infinite price with a finite value everyone trusts.","model":"The lesson treats the paradox as a fidelity check on expectation: the game's value is infinite in theory, finite in every real casino, and the five resolutions each pick a different reason the theory misprices this real one.","mechanics":"Payout doubling becomes an infinite sum, so the mean exists but diverges. Utility thresholds convert money into feeling and fix prices for humans but not for the theory. A finite bank's cap makes the game finite and the price moderate. Time averages support a different decision rule than ensemble averages.","pitfalls":["Calling the paradox a trick of bad math: the calculation is right and still misprices the real game.","Assuming utility theory settles it for every agent.","Confusing the law of large numbers with a reason to bet infinitely long.","Ignoring that tiny probabilities are not the whole problem.","Believing modern decision theory has one resolution everyone accepts."],"whenNot":"This is a probability and decision-theory lesson; it does not cover the city's history beyond what the paradox needs."} -->

# The St. Petersburg Paradox: When Infinity Meets Common Sense

*(This lesson covers the probability paradox, not the city, though the city does come into it.)*

## The Game

A casino offers you a game. A fair coin is flipped repeatedly until it lands heads. If heads appears on the first flip, you win $2. If it first appears on the second flip, you win $4. On the third, $8. Each additional tails doubles the pot, so if heads first appears on flip *k*, you win 2^*k* dollars.

The question is how much you should pay to play.

Most people, asked cold, name a figure between $5 and $25. That seems reasonable. You will usually win $2 or $4, and landing ten tails in a row happens only about once in a thousand tries.

## The Calculation That Breaks Everything

Classical probability says a gamble is worth its **expected value**: the sum of each outcome's payoff multiplied by its probability. So we compute:

- Heads on flip 1: probability 1/2, payoff $2, contribution **$1**
- Heads on flip 2: probability 1/4, payoff $4, contribution **$1**
- Heads on flip 3: probability 1/8, payoff $8, contribution **$1**
- ...and so on forever.

Each term contributes exactly one dollar, because the halving probability cancels the doubling payoff. The sum is

$$E = \sum_{k=1}^{\infty} \frac{1}{2^k} \cdot 2^k = 1 + 1 + 1 + \cdots = \infty$$

The expected value is **infinite**. If expected value is the correct guide to rational choice, you should pay any finite price to play: your life savings, your house, a billion dollars. Nobody sane would do this, and it isn't clear the refusers are the ones making a mistake.

That is the paradox. It is not a contradiction in the mathematics, which is airtight. It is a collision between a formal theory of rational choice and deep, robust intuition. Something has to give, and the interesting question is what.

## A Little History

Nicolaus Bernoulli posed the problem in a 1713 letter to the French mathematician Pierre Rémond de Montmort. The name comes from Nicolaus's cousin **Daniel Bernoulli**, who published the most famous analysis in 1738 in the *Commentaries of the Imperial Academy of Sciences of Saint Petersburg*. The city appears only because of where the paper was printed.

The Swiss mathematician Gabriel Cramer had independently reached nearly the same solution a decade earlier. Daniel Bernoulli graciously credited him.

## Resolution 1: Diminishing Marginal Utility

Daniel Bernoulli's key insight founded modern economics. **Money is not the same as value.** Winning $1,000 means a great deal to someone with nothing and almost nothing to a billionaire. Each additional dollar is worth a little less to you than the one before.

He proposed that people maximize expected **utility**, not expected money, and suggested utility grows roughly with the *logarithm* of wealth. Doubling your money always adds the same fixed amount of happiness, whether you go from $10 to $20 or from $10 million to $20 million.

Apply this to the game. With log base 2 utility and ignoring existing wealth, the expected utility is

$$E[U] = \sum_{k=1}^{\infty} \frac{1}{2^k} \cdot \log_2(2^k) = \sum_{k=1}^{\infty} \frac{k}{2^k} = 2$$

That series converges. A utility of 2 corresponds to a sure payment of 2² = **$4**, so the game is worth about the same to you as four guaranteed dollars.

A proper treatment accounts for your existing wealth *w*: you want the price *c* at which your expected log wealth is unchanged. Under that model, someone with $1,000 should pay about $11, and a millionaire about $21. Richer people rationally pay more, because losing the entry fee hurts them less. This matches intuition well.

**The concept to take away:** expected utility theory, which later became the axiomatic foundation of decision theory through von Neumann and Morgenstern (1944), was born from this paradox.

## The Counterattack: Super-St. Petersburg

In 1934 Karl Menger (son of the economist Carl Menger) pointed out that the log fix is a patch, not a cure. If utility is logarithmic, the casino simply changes the payoffs to 2^(2^*k*) dollars. The utility of each outcome becomes 2^*k*, and the expected utility diverges again.

The general lesson is sharp. **For any unbounded utility function, you can construct a St. Petersburg–style game with infinite expected utility.** You have only two options:

1. Accept that utility is **bounded**. There is some maximum level of goodness, so beyond a point more money adds almost nothing. Kenneth Arrow and others defended this view.
2. Accept that some rational agents will pay absurd sums for certain gambles.

Most economists quietly choose option 1, but it has costs. Bounded utility produces its own odd behavior near the ceiling, and it sits uneasily with ethical views on which, say, saving more lives is always better.

## Resolution 2: The Casino Isn't Infinite

A more practical objection is that no casino can actually pay out 2^100 dollars, a figure that dwarfs the number of atoms in the observable universe. Georges-Louis Leclerc, Comte de Buffon, raised this point in the 18th century.

If the bank holds at most *W* dollars, then any run longer than about log₂(*W*) flips pays only *W*. The infinite series is cut off after roughly *L* = log₂(*W*) terms, each contributing $1, plus a small remainder. The expected value becomes approximately **L + 1** dollars.

The logarithm is merciless:

- A casino with $1 million: about **$21**
- A casino with $1 trillion (around 2^40): about **$41**
- A casino holding all the wealth on Earth: still under **$50**

The infinity was hiding entirely in outcomes that can never happen. This resolution is satisfying for real-world gambling but philosophically incomplete, since the idealized puzzle still asks what you *should* do in the infinite case.

## Resolution 3: Repeated Play and the Law of Large Numbers

Expected value is usually justified by the **law of large numbers**: play a game many times and your average winnings converge to its expected value. But this law requires a *finite* expectation. The St. Petersburg game is a textbook **heavy-tailed distribution**, and the usual guarantees collapse.

William Feller showed in the 1940s what actually happens. If you play *n* games, your total winnings grow like *n* log₂ *n*. Your **average per game creeps upward like log₂ *n***. It grows without bound, but agonizingly slowly. A fair per-game price therefore depends on how many games you intend to play: around $10 for a thousand games and $20 for a million.

You can see this yourself:

```python
import random, math

def play():
    k = 1
    while random.random() < 0.5:
        k += 1
    return 2 ** k

for n in [10**3, 10**4, 10**5, 10**6]:
    avg = sum(play() for _ in range(n)) / n
    print(f"n={n:>8}  average={avg:8.2f}  log2(n)={math.log2(n):.2f}")
```

Run it several times. The averages lurch around and are dominated by the occasional monster payout, but they track log₂(*n*), not infinity. This is what life under a heavy tail feels like: long stretches of modest results punctuated by rare events that dominate the total.

## Resolution 4: Time Averages vs. Ensemble Averages

A modern twist from physicist Ole Peters (2011) and the "ergodicity economics" movement reframes the problem. Expected value is an **ensemble average**: the mean outcome across infinitely many parallel versions of you. But you live one life, sequentially, and your wealth compounds. What matters for a single individual over time is the **time-average growth rate** of wealth. For multiplicative processes, that is the expected change in the *logarithm* of wealth.

On this view, Bernoulli's logarithm is not a psychological assumption about happiness. It falls out of the mathematics of compounding. It is closely related to the **Kelly criterion** used by professional gamblers and some investors. The claim remains debated, but it offers a physically grounded rationale for log utility.

## Resolution 5: Ignore Tiny Probabilities

Buffon and d'Alembert also suggested that rational agents should treat sufficiently small probabilities, say below one in ten thousand, as effectively zero. That truncates the series.

Behavioral economics complicates this. Prospect theory (Kahneman and Tversky) shows that people actually *overweight* small probabilities in many contexts, which is why lotteries exist. A cutoff also seems arbitrary: why one in ten thousand and not one in a million? Still, the idea survives in modern debates.

## Why This Still Matters

The paradox is not a dusty curiosity. Versions of it appear across modern thinking:

- **Finance.** David Durand (1957) noticed that valuing growth stocks whose earnings grow faster than the discount rate produces St. Petersburg–style infinite valuations. Analysts must impose growth caps or finite horizons, just as Buffon capped the casino.
- **Heavy tails everywhere.** Venture capital returns, city sizes, earthquake energies, and viral content all follow power laws in which averages are dominated by rare extremes. Nassim Taleb's "Black Swan" writing is essentially about living in St. Petersburg–type distributions.
- **Pascal's Mugging and AI.** Philosophers and AI-alignment researchers worry about agents that maximize expected value and can be manipulated by tiny-probability, astronomically large payoffs ("give me $5 or I'll use magic to harm 3↑↑↑3 people"). Designing decision procedures that resist this "fanaticism" is an open problem.
- **Ill-defined expectations.** The **Pasadena game** (Nover and Hájek, 2004) goes further. Its payoffs alternate in sign so that the expected value is not infinite but *undefined*: a conditionally convergent series whose sum depends on the order you add the terms. Decision theory currently has no consensus way to value it.

## The Big Picture

The St. Petersburg paradox teaches that **expected value is a tool, not a law of nature**. It works well when distributions have thin tails, finite means, and outcomes that can actually be realized. Push it into infinity and it produces nonsense, forcing us to decide what rationality really means.

Each resolution captures a real truth, and none is universally accepted:

- **Utility:** money isn't value.
- **Bounded resources:** infinity isn't physical.
- **Feller:** averages behave strangely under heavy tails.
- **Ergodicity:** you live one timeline, not all of them.
- **Probability thresholds:** there may be a sane limit to how much the extremely unlikely should matter.

Three centuries after a letter between two mathematicians, it remains one of the best puzzles for exposing the hidden assumptions in how we reason about risk.
