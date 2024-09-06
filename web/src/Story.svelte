<script>
  import { onMount } from 'svelte';

  export let story;

  function handleFocus(event) {
    Array.from(document.querySelectorAll('.focus')).forEach(word => {
      word.classList.remove('focus');
    });
    event.target.classList.add('focus');
  }

  onMount(() => {
    document.querySelector('.word').focus();
  });
</script>


<h3 class="mb-3">{story.title}</h3>
{#each story.sentences as sentence}
  <p class="sentence fs-3 mt-4">
    {#each sentence.split(' ') as word}
      <span class="word" tabindex="0" on:focus={handleFocus}>{word}</span>
    {/each}
  </p>
{/each}

<style>
.sentence {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
}
.word {
  border-bottom: 3px solid transparent;
  cursor: pointer;
  padding: 0 0.25em 0.2em 0.25em;
}
.word:global(.focus) {
  border-bottom-color: #000;
  outline: none;
}
</style>
