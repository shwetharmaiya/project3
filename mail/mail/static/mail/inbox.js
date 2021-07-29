document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_mail() { 
  console.log("Here we are!");
  recipients = document.querySelector('#compose-recipients').value;
  subject = document.querySelector('#compose-subject').value;
  mailbody = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: mailbody
    })
  })
  .then((response) => response.json())
  .then(result => {
    console.log(result.message);
    alert(result.message);

    load_mailbox('sent');
  });
}

function load_mailbox(mailbox) {
  
  var email_display = document.querySelector('#emails-view')
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  email_display.innerHTML = '';
  email_display.innerHTML = `<h3>${mailbox}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
  
    if (emails.length == 0) {
      email_display.innerHTML = 'Nothing to see here';
    } else { 
      for (email in emails) {
        //email_display.innerHTML = "these are the emails"
        var mail = document.createElement('div');
        var sender = document.createElement('h4');
        var sub = document.createElement('p');
        var time = document.createElement('p');
        var id = document.createElement('p');

        id.innerHTML = emails[email]['id'];
        id.style.display = 'none';
        
        sender.innerHTML = emails[email]['sender'];
        if (emails[email]['subject'] == '') {
          sub.innerHTML = 'No Subject';
          sub.style.color = 'red';
        } else {
          sub.innerHTML = emails[email]['subject'];
        }
        time.innerHTML = emails[email]['timestamp'];
        mail.style.borderStyle = 'solid';
        mail.style.borderColor = 'black';
        mail.style.borderWidth = '0.1rem';
        mail.style.marginBottom = '0.3rem';
        if (emails[email]['read'] == true) {
          mail.style.backgroundColor = 'gray';
        }
        else {
          mail.style.backgroundColor = 'white';
        }
        mail.classList.add('container');
        mail.classList.add('mail');

        mail.style.display = 'block';
        email_display.appendChild(mail);
        mail.appendChild(sender);
        mail.appendChild(sub);
        mail.appendChild(time);
        mail.appendChild(id);

        mail.addEventListener('click', () => load_emailitem(mailbox));
        sub.addEventListener('click', () => load_emailitem(mailbox));
        time.addEventListener('click', () => load_emailitem(mailbox));
        sender.addEventListener('click', () => load_emailitem(mailbox));
        
      }
    }
  });

}

function load_emailitem(mailbox) { 
  
  event.stopImmediatePropagation();
  
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  email_view = document.querySelector('#email-view');
  email_view.style.display = 'block';

  var tar = event.target;
  
  if (!(tar.tagName == 'DIV')) {
    tar = tar.parentElement;
  }
  var chItem = tar.children;
  var id = chItem[3].innerHTML;
 
  email_view.innerHTML= "";
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      var div = document.createElement('div');
      div.classList.add('container');
      div.classList.add('jumbotron'); //A lightweight, flexible component that can optionally extend the entire viewport to showcase key marketing messages on your site.

      var sub = document.createElement('h3');
      sub.innerText = email['subject'];
      var sender = document.createElement('h5');
      sender.innerText = `From: ${email['sender']}`;
      var rcpt = [];
      for (recipient in email['recipients']) {
          rcpt[recipient] = document.createElement('h5');
         
          rcpt[recipient].innerText = `To : ${email['recipients'][recipient]}`;
      }
      var body = document.createElement('p');
      body.innerText = email['body'];
      var time = document.createElement('p');
      time.innerText = email['timestamp'];
      
      time.style.color = 'blue';
      
      body.style.padding = '2rem';
      body.style.backgroundColor = 'lightgray';

      div.appendChild(sub);
      div.appendChild(sender);
      div.appendChild(time);
    
      for (recipient in email['recipients']) {
        div.appendChild(rcpt[recipient]);
      }
     
      email_view.appendChild(div);
      email_view.appendChild(body);
      
      if (email['read'] == false) {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
        
      }

      if(mailbox != 'sent') { 
        var archive = email['archived'];
        var btn = document.createElement('button');
        
        if (archive) { 
          btn.innerText = 'Unarchive';
        } else { 
          btn.innerText = "Archive";
        }

        //classList not working
        btn.classList.add('btn-primary');
        btn.classList.add('btn');

        //Archive Logic 
        btn.addEventListener("click", ()  => {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: !archive
            })
          });
          load_mailbox('inbox');
        });
        email_view.appendChild(btn);
      }     
 
      var reply = document.createElement('button');
      reply.innerText = 'Reply';
      reply.classList.add('btn-primary');
      reply.classList.add('btn');
 
      reply.addEventListener("click", () => {
        compose_email();

        document.querySelector('#compose-recipients').value = email['sender'];
        if (email['subject'].search('Re:')) {
          document.querySelector('#compose-subject').value = email['subject'];
        }
        else {
          document.querySelector('#compose-subject').value = `Re: ${email['subject']}`;
        }
        document.querySelector('#compose-body').value = `On ${email['timestamp']}, ${email['sender']} wrote: ${email['body']}`;

      });

      email_view.appendChild(reply);
    
    });

}