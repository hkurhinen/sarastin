/* global bootbox */

(() => {
  'use strict';

  function updateEvent(event) {
    $.ajax({
      url: "/event/" + event.id,
      method: 'PUT',
      data: {start: event.start.format(), end: event.end.format()},
      success: function(result){
        $('.calendar').fullCalendar('refetchEvents');
      }
    });
  }

  $('.calendar').fullCalendar({
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'agendaWeek,agendaDay'
    },
    selectable: true,
    editable: true,
    locale: 'fi',
    defaultView: 'agendaWeek',
    allDaySlot: false,
    timeFormat: 'HH:mm',
    slotLabelFormat: 'HH:mm',
    timezone: 'Europe/Helsinki',
    events: {
      url: '/events',
      cache: true
    },
    eventDrop: function( event, delta, revertFunc, jsEvent, ui, view ) { 
      updateEvent(event);
    },
    eventResize: function(event, delta, revertFunc, jsEvent, ui, view) {
      updateEvent(event);
    },
    select: function( start, end, jsEvent, view) {
      const serials = JSON.parse($('input[name="serials"]').val());
      const options = serials.map((serial) => {
        return {value: serial, text: serial};
      });
      
      if (options.length < 1) {
        bootbox.alert("Sinulla ei ole käyttöoikeutta yhteenkään laitteeseen.");
      } else {
        bootbox.prompt({
          title: "Valitse laite",
          inputType: 'select',
          inputOptions: options,
          callback: (result) => {
            console.log(result);
            $.post('/event', {start: start.format(), end: end.format(), serial: result}, (res) => {
              $('.calendar').fullCalendar( 'refetchEvents' );
            });
          }
        });
      }
    }
  });
  
})();