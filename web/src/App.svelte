<script>
  import CreateStoryForm from './CreateStoryForm.svelte';
  import Story from './Story.svelte';

  let state = 'initial';
  let story = null;

  async function handleCreateStory (event) {
    const { topic, grade, sentenceCount } = event.detail;

    state = 'creating';
    const resp = await fetch('/stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        grade,
        sentenceCount,
      }),
    });

    const data = await resp.json();
    story = data.story;
    state = 'created';
  }
</script>

<main>
  <div class="container">
    <div class="row mt-3 justify-content-center">
      <div class="col-md-6">
        {#if state === 'initial' || state === 'creating'}
          <CreateStoryForm
            creating={state === 'creating'}
            on:create-story={handleCreateStory}
          />
        {:else if state === 'created'}
          <Story story={story} />
        {/if}
      </div>
    </div>
  </div>
</main>

<style>

</style>
