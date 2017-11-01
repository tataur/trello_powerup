/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;

var SIGMA_ICON = './sigma.svg';

incoming = "приход";
spending = "расход";
var TOTAL_DIFF = 0;

/*var getFields = function () {
    console.log(incoming);
    console.log(window.incoming);
    console.log(spending);
    console.log(window.spending);
    /*window.incoming = document.getElementById("income").value;
    window.spending = document.getElementById("spend").value;
    console.log(window.incoming);
    console.log(window.spending);#1#
};*/

var getBadges = function(t){
  return t.get('board', 'shared', 'costs')
  .then(function(costs){
    return t.card('id')
    .then(function(id) {
      return costs && costs[id.id] ? [{
        text: 'Cost: ' + costs[id.id],
        color: (costs[id.id] == 0) ? 'red' : null
      }] : [];
    });
  });
};

var cardButtonCallback = function(t){

  return t.get('board', 'shared', 'costs')
  .then(function(costs){
  return t.card('id')
    .then(function(id) {
      return t.popup({
        title: 'Set Cost...',
        items: function(t, options) {
          var newCost = parseFloat(options.search).toFixed(2)
          var buttons = [{
            text: !Number.isNaN(parseFloat(options.search)) ? 'Set Cost to ' + newCost : '(Enter a number to set cost.)',
            callback: function(t) {
              if (newCost != 'NaN') {
                var newCosts = costs ? costs : {};
                newCosts[id.id] = newCost;
                t.set('board','shared','costs',newCosts);
              }
              return t.closePopup();
            }
          }];
          if (costs && costs[id.id]) {
            buttons.push({
              text: 'Remove cost.',
              callback: function(t) {
                var newCosts = costs ? costs : {};
                delete newCosts[id.id];
                t.set('board','shared','costs',newCosts);
                return t.closePopup();
              }
            });
          }
          return buttons;
        },
        search: {
          placeholder: 'Enter Cost',
          empty: 'Error',
          searching: 'Processing...'
        }
      });
    });
  });

};

var boardButtonCallback = function(t, opts) {
    return t.lists('id', 'name')
        .then(function(lists) {
            return t.cards('id', 'name', 'idList')
                .then(function(cards) {
                    return t.get('board', 'shared', 'costs')
                        .then(function(costs) {
                            getCosts(t, lists, cards, costs);
                        });
                });
        });
};

function getCosts(t, lists, cards, costs) {
    {
        var entries = [];
        var listSums = {};
        var activeIds = cards.map(function (card) { return card.id; });
        for (var cost in costs) {
            if (activeIds.indexOf(cost) > -1) {
                var cb = function (a) { t.showCard(a); };
                entries.push({
                    text: costs[cost] + ' - ' + cards.find(function (card) { return card.id == cost; }).name,
                    callback: cb.bind(null, cost)
                });
                if (lists.find(function (list) { return cards.find(function (card) { return card.id == cost; }).idList == list.id })) {
                    var thisList = listSums[lists.find(function (list) { return cards.find(function (card) { return card.id == cost; }).idList == list.id }).name];
                    if (!thisList) {

                        listSums[lists.find(function (list) { return cards.find(function (card) { return card.id == cost; }).idList == list.id }).name] = 0;
                    }
                    listSums[lists.find(function (list) { return cards.find(function (card) { return card.id == cost; }).idList == list.id }).name] += parseFloat(costs[cost]);
                }
            }
        }
        entries.push({ text: '➖➖➖➖➖➖➖➖➖➖➖' });
        entries.push({ text: 'SUMMARY BY COLUMN:' });
        for (var listSum in listSums) {
            entries.push({ text: listSum + ': ' + parseFloat(listSums[listSum]).toFixed(2) });
        }
        entries.push({ text: '➖➖➖➖➖➖➖➖➖➖➖' });
        entries.push({ text: 'Diff:' });

        var incomings = [];
        var spendings = [];
        for (var item in listSums) {
            if (item == incoming) {
                incomings.push(listSums[item]);
            } else if (item == spending) {
                spendings.push(listSums[item]);
            }
        }
        TOTAL_DIFF = incomings - spendings;

        entries.push({ text: TOTAL_DIFF });

        return t.popup({
            title: 'Cost Summary',
            items: entries
        });
    }
}

TrelloPowerUp.initialize({
    'board-buttons': function(t, options) {
        return t.lists('id', 'name')
            .then(function(lists) {
                return t.cards('id', 'name', 'idList')
                    .then(function(cards) {
                        return t.get('board', 'shared', 'costs')
                            .then(function(costs) {
                                getCosts(t, lists, cards, costs);

                                return [{
                                    icon: SIGMA_ICON,
                                    text: 'Total diff: ' + TOTAL_DIFF,
                                    callback: boardButtonCallback
                                }];
                            });
                    });
            });
    },
    'card-badges': function(t, options) {
        return getBadges(t);
    },
    'card-buttons': function(t, options) {
        return t.get('board', 'shared', 'costs')
            .then(function(costs) {
                return t.card('id')
                    .then(function(id) {

                        return [{
                            // its best to use static badges unless you need your badges to refresh
                    // you can mix and match between static and dynamic
                            icon: SIGMA_ICON, // don't use a colored icon here
                            text: costs && costs[id.id] ? 'Cost: ' + costs[id.id] : 'Add Cost...',
                            callback: t.memberCanWriteToModel('card') ? cardButtonCallback : null
                        }];
                    });
            });
    },
    'show-settings': function(t, options) {
        return t.popup({
            title: 'Cost fields settings',
            url: './settings.html',
            height: 100
        });
    },
});