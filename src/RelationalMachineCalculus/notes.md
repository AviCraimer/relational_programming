<!-- Claude Convo on the Paper:  https://console.anthropic.com/workbench/87bd20a0-5bcd-4b84-8ad2-a77342af4e2c -->

# Operational Semantics - Small Step
The transition steps operate on a triple (S_A, M, K) where

- S_A is a location-indexed set of operand stacks.
  - The values that can go on the operand stacks are the terms. i.e., Either variables or n-ary functions applied to n arguments.
  - Note that a nullary function is a constant value so in my implementation any literal javascript value could be a term, implicitly viewing it as a function symbol with no arguments.
- M is the current operation which is an instruction to be executed.
  - In some places in the paper these are also called terms, but I will consistently use the term "operation" and reserve the term "term" for variables and functions.
- K is the continuation stack (i.e., any remaining operations in a linear order).
  - The values that may be on the continuation stack are *operations* , e.g., push, pop, etc.

## Failure and Success of Computation on a Branch
- If no rules can be applied the computation fails and has zero child branches.
- The empty continuation stack is denoted ε.
- Computation ends successfully on a branch when a rule outputs (S_A, ★, ε). That is, when the continuation stack is empty and the instruction is ★. At this point, the contents of S_A can be viewed as the output for that branch.

## Equality of Outputs and Multiset as Summary of Computation
- In discussing the big-step semantics, the authors characterize the output in terms of the pair (S_A, sigma) where sigma is a substitution. The idea here is that instead of performing the substitutions in-place as suggested in the transition rules below, we can simply keep track of them and apply them lazily during the computation and at the end.
- In that case we can compare the equality of outputs on two branches (S_A, sigma) (T_A, tau) by first applying sigma(S_A) and tau(T_A) and then comparing the resulting stack values for equality.
- The authors do not address whether the equality of outputs is up to alpha-equivalence (renaming) for local variable names.
- For global variables names it is based on exact match and not up to renaming.
- After all branches fail or complete successfully (assuming the computation terminates) we count up the number of equal outputs across each branch and gather them into a multiset.


## Transition Rules

1. Unit Continuation:
   (S_A, ★, M K) → (S_A, M, K)
   Description: Removes the unit (★) and moves to the next term in the continuation.

2. Kleene Star:
   (S_A, M*, K) → (S_A, ★, K) | (S_A, M, M* K)

  Note: Here I use the pipe symbol | to represent branched computation.
  Description:
  - Non-deterministically computes a continution branch (left) and an iteration branch (right).
  - Finite iteration may be achieved by having all the iteration branches eventually all fail after some number of iterations.
  - If the iteration branch fails immediately M* is equivalent to doing nothing (i.e., ★).

3. Sequencing:
   (S_A, M;N, K) → (S_A, M, N K)
   Description: Pushes N onto the continuation stack and proceeds with executing M.

4. Branching:
   (S_A, M+N, K) → (S_A, M, K) | (S_A, N, K)
   Description: Non-deterministically executes both branches.
    - Note in the small step transitions we keep track of each branch separately.
    - Later in the big step computation we will compute a multi-set from the results of the branches.
    - However, it seems inefficient to run the same computation on multiple branches so we may want to use memoization (although this uses more memory).

5. Push:
   (S_A·S_a, [t]a, K) → (S_A·S_a t, ★, K)
   Description:
   - S_A·S_a means that S_a is the operand stack indexed to location a. S_A represents any other operand stacks that might be present. The whole thing S_A·S_a represents all the operand stacks.
   - We can read the rule as saying that the instruction [t]a succeeds if there is a stack at location a, and it pushes the value t onto stack a and proceeds with the continuation rule.
   - If we have an instruction [t]a but there is no stack at location a then the computation fails. In my implementation this will be impossible due to the expressions being parameterized by a set of stack locations.

6. New Variable:
   (S_A, ∃x.M, K) → (S_A, {y/x}M, K) s.t. y is fresh
   Description:
   - Introduces a fresh variable y and substitutes it for x in M.
   - Replacing x with y
   - y being fresh means that y is does not occur anywhere in the S_A, M, or K.

7. Pop Variable:
   (S_A·S_a x, a<x>, K) → (S_A·S_a, ★, K)
   Description:
   - Pops a variable at the head of stack a. The popped variable must exactly match what is inside a<_>.

8. Pop Function:
   (S_A·S_a f(R), a<f(T)>, K) → (S_A·S_a R, a<T>, K)
   - Description: Matches a function term on stack a and continues matching its arguments.
   - This is part of the unification process. If you popping f(T) with argument T(R), the next step is to pop T with R.  This is part of checking that f(T) and f(R) match.
   - This allows for recursive matching of complex terms.
   - Note: it seems weird that the symbol f is thrown away by this rule, but this is consistent with what always happens when a constant is matched in a pop operation. The goal of popping non-variables is to match them which this rule accomplishes.

9. Pop and Substitute (Variable on Stack):
   (S_A·S_a x, a<t>, K) → ( {t/x}(S_A·S_a), ★, {t/x}K )   s.t. x ∉ t
   - Description: Pops a variable from stack a, substitutes it with t throughout the state and continuation.
     -Note that t can be a variable or a complex term.
   - The condition s.t. x ∉ t is a bit unclear. It *does not* mean that t is a set with x as an element, as the notation suggests. Rather, it means that x does not occur as a variable within the expression t. This condition prevents circular substitution.


10. Pop and Substitute (Term on Stack):
    (S_A·S_a t, a<x>, K) → ({t/x}(S_A·S_a), ★, {t/x}K)   s.t (x ∉ t)
    Description:
    - Pops a term t from stack a, substitutes it for x throughout the state and continuation.

Clarifications:
- In rules 9 and 10, the substitution {t/x} is applied to the entire state S_A·S_a, not just the stack S_a. This means the substitution affects all stacks in the memory.
- The substitution is also applied to all the operations inside the continuation stack K since operations can contain terms (e.g., push and pop operations).


