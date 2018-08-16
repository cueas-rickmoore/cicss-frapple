
from copy import copy
from collections import OrderedDict
import json

from atmosci.utils.config import ConfigObject

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# kills 10%, 50%, 90% of buds at temp
KILL_TEMPS = ( (-25,-25,-25), (11,5,0), (19,10,4), (22,17,11), (25,21,18),
               (27,26,24), (28,26,25), (29,27.1,26.6) )
# stage data dictionary keys
STAGES = ('dormant','stip','gtip','ghalf','cluster','pink','bloom','petalfall')

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

APPLES = ConfigObject('apples', None)

APPLES.stages = copy(STAGES)
APPLES.kill_temps = OrderedDict(zip(STAGES, KILL_TEMPS))
del KILL_TEMPS

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

APPLES.varieties = {
        'empire':{
            'description':'Empire Apple', 'min_chill_units':1100, 
            'phenology':OrderedDict(zip(STAGES,(0,91,107,170,224,288,384,492)))
           },
        'mac_geneva':{
            'description':'Macintosh Apple (Geneva)',
            'min_chill_units':1100,
            'phenology':OrderedDict(zip(STAGES,(0,85,121,175,233,295,382,484)))
           },
        'red_delicious':{
            'description':'Red Delicious Apple', 'min_chill_units':1200, 
            'phenology': OrderedDict(zip(STAGES,(0,97,132,192,248,331,424,539)))
           }
        }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

APPLES.chart = { 
    'stage' : { 'colors': OrderedDict(zip(STAGES,
                          ('#FFEBCD', '#C0C0C0', '#32CD32', '#008000', '#87CEEB',
                           '#FF00FF', '#FFFF00', '#FF0000', '#A0522D'))),
                'labels': OrderedDict(zip(STAGES,
                          ('Dormant', 'Silver Tip', 'Green Tip', '1/2" Green',
                           'Tight Cluster', 'Pink Bud', 'Bloom', 'Petal Fall',
                           'Fruit Set')))
              },
    'kill': { 'colors': OrderedDict( (('10%','#1E90FF'), ('50%','#FFD700'),
                                      ('90%','#FF0000')) )
            },
}

del STAGES

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

def varietiesAsJson(varieties_cfg):
    varieties = [ ]
    for variety in varieties_cfg.children():
        var_dict = variety.flatten()
        var_json = json.dumps(var_dict, separators=(',', ':'))
        varieties.append('{"%s":%s}' % (variety.name, var_json))
    return '{"varieties":%s}' % ','.join(varieties)

