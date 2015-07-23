BitPoints
=========
Effortlessly point tickets visually and collaboratively over the internet in real time.

## Prereqs
* NodeJS

## Install it
`git clone https://github.com/websdotcom/BitPoints.git`

`npm install`

## Run it
`npm start`

## Integrate with your ticketing system
Optionally integrate BitPoints with your existing ticketing system to fully incorporate estimating into your existing process

### Jira
As a user with Administrator privileges, add this code block to the 'Announcement Banner', swapping out `{{BITPOINTS_HOST}}` and `{{JIRA_HOST}}`
```HTML
<script>
// BitPoints Integration
jQuery(function(){
  if(jQuery('#key-val').length > 0){
    jQuery('<img src="http://{{BITPOINTS_HOST}}/addTicketCookie?ticketSystem=jira&ticketHost={{JIRA_HOST}}&ticketID='+jQuery('#key-val').text()+'&ticketTitle='+encodeURIComponent(jQuery('#summary-val').text())+'" style="width:1px;height:1px;position:absolute;" />').appendTo('body');
  }
});
</script>
```
