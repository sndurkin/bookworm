$(document).ready(async () => {
  const booksList = $('#books-list');
  const createButton = $('#create-btn');
  const ageInput = $('#age');
  const sentenceCountInput = $('#sentence-count');
  const topicInput = $('#topic');
  const actionButtons = $('#action-buttons');
  let currentWord = null;

  await $.ajax({
    url: '/books',
    method: 'GET',
    dataType: 'json',
    complete: function(resp) {
      const { books } = resp.responseJSON;
      books.forEach(book => {
        booksList.append(
          $(`<a href="#" class="list-group-item list-group-item-action" />`).text(book.title).click(function() {
            renderBook({
              ...book,
              story: JSON.parse(book.story),
            });
          })
        );
      });
    }
  });

  let book = null;
  createButton.on('click', createBook);
  topicInput.on('keypress', function(event) {
    if (event.key === 'Enter') {
      createBook();
    }
  });

  $('#go-previous').on('click', goPrevious);
  $('#go-next').on('click', goNext);

  function goPrevious() {
    if (currentWord) {
      const previousWord = currentWord.prev('.word');
      if (previousWord.length) {
        previousWord.focus();
      }
      else {
        currentWord.parent().prev().find('.word').last().focus();
      }
    }
  }

  function goNext() {
    if (currentWord) {
      const nextWord = currentWord.next('.word');
      if (nextWord.length) {
        nextWord.focus();
      }
      else {
        currentWord.parent().next().find('.word').first().focus();
      }
    }
  }

  async function createBook() {
    const topic = topicInput.val().trim();
    const age = ageInput.val().trim();
    const sentenceCount = sentenceCountInput.val().trim();
    if (!topic || !age || !sentenceCount) {
      return;
    }

    try {
      createButton.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
      const resp = await $.ajax({
        url: `/books`,
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
          topic,
          age,
          sentenceCount,
        }),
        complete: function() {
          createButton.html('Create book <i class="bi bi-arrow-right"></i>');
        }
      });

      if (resp.book) {
        renderBook(resp.book);
      }
    } catch (error) {
      console.error(error);
      message$.html(`<div class="alert alert-danger">${'Failed to fetch and process recipe'}</div>`);
    }
  }

  function renderBook(book) {
    $('#initial-form').hide();

    const { title, story } = book;

    // Render title and content
    const bookDetails = $('#book-details');
    bookDetails.empty();
    bookDetails.append(
      $(`<h2 class="mb-5" />`).text(title)
    );

    // Render content
    story.forEach(sentence => {
      const sentenceElement = $(`<p class="sentence fs-3" />`);
      sentence.split(' ').forEach(word => {
        sentenceElement.append($(`<span class="word" tabindex="0" />`).text(word));
      });
      bookDetails.append(sentenceElement);
  });

    actionButtons.show();
    $('.word').on('focus', function() {
      $('.word.focus').removeClass('focus');

      currentWord = $(this);
      currentWord.addClass('focus');
    });
    bookDetails.find('.word').first().focus();
  }

});
