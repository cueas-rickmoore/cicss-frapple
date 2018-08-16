
import os
from collections import OrderedDict

import numpy as N

from atmosci.utils.config import ConfigObject, ConfigMap

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

SERVER_DIRPATH = os.path.split(os.path.abspath(__file__))[0]
PKG_DIRPATH = SERVER_DIRPATH[:SERVER_DIRPATH.rfind(os.sep)]
RESOURCE_PATH = os.path.join(SERVER_DIRPATH, 'resources')

PROJECT_END_DAY = (6,30)
PROJECT_START_DAY = (10,1)

SEASON_END_DAY = (6,30)
SEASON_START_DAY = (10,1)

# kills 10%, 50%, 90% of buds at temp
KILL_TEMPS = [ (-25,-25,-25), (11,5,0), (19,10,4), (22,17,11), (25,21,18),
               (27,26,24), (28,26,25), (29,27.1,26.6) ]
# stage data dictionary keys
STAGES = ['dormant','stip','gtip','ghalf','cluster','pink','bloom','petalfall']

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# specialize the ConfigObject slightly
class ToolConfigObject(ConfigObject):

    def getFiletype(self, filetype_key):
        if '.' in filetype_key:
           filetype, other_key = filetype_key.split('.')
           return self[filetype][other_key]
        else: return self.filetypes[filetype_key]


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

CONFIG = ToolConfigObject('config', None)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# standard project, regions, sources, statis and view_map configurations are
# inherited from atmosci.seasonal.config
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
from atmosci.seasonal.config import CFGBASE
CFGBASE.project.copy('project', CONFIG)
CFGBASE.regions.copy('regions', CONFIG)
CFGBASE.sources.copy('sources', CONFIG)
CFGBASE.static.copy('static', CONFIG)
CFGBASE.view_map.copy('view_map', CONFIG)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# Apple Freeze Damage Potential tool datasets
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CONFIG.newChild('datasets')
# use common seasonal lat/lon dataset configurations
CFGBASE.datasets.lat.copy('lat', CONFIG.datasets)
CFGBASE.datasets.lon.copy('lon', CONFIG.datasets)
del CFGBASE

CONFIG.datasets.compressed = { 'dtype':int,
                               #'dtype_packed':N.int8,
                               'dtype_packed':N.int16,
                               'end_day':PROJECT_END_DAY,
                               'compression':'gzip',
                               'chunks':('num_days',1,1),
                               'missing_data':-32768,
                               'missing_packed':-32768,
                               'period':'date',
                               'scope':'season',
                               'start_day':PROJECT_START_DAY,
                               'view':('time','lat','lon'),
                             }

CONFIG.datasets.compressed.copy('mint', CONFIG.datasets)
CONFIG.datasets.mint.description = 'Daily Minimum Temperature'
CONFIG.datasets.mint.scope = 'season'
CONFIG.datasets.mint.timespan = 'Season'
CONFIG.datasets.mint.units = 'F'

CONFIG.datasets.mint.copy('T10', CONFIG.datasets)
CONFIG.datasets.T10.description = '10%% Kill Temperature'

CONFIG.datasets.mint.copy('T50', CONFIG.datasets)
CONFIG.datasets.T50.description = '50%% Kill Temperature'

CONFIG.datasets.mint.copy('T90', CONFIG.datasets)
CONFIG.datasets.T90.description = '90%% Kill Temperature'

CONFIG.datasets.compressed.copy('stage', CONFIG.datasets)
CONFIG.datasets.stage.description = "Bud Development Stage"

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# paths to Apple Freeze Damage Potential tool directories
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CONFIG.dirpaths = { 'package':PKG_DIRPATH,     # too; package directory
                    'resources':RESOURCE_PATH, # tool resource directory
                    'server':SERVER_DIRPATH,   # tool server directory
                   }
# delete the directory path constants
del PKG_DIRPATH, RESOURCE_PATH, SERVER_DIRPATH


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# filename templates
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CONFIG.filenames = {
       'tool':{'risk':'%(year)d-%(variety)s-Freeze-Risk-Daily.h5',
               'stage':'%(year)d-%(variety)s-Stage-Daily.h5',
              },
       'build':{'chill':'%(year)d-Frost-Apple-Chill.h5',
                'temps':'%(year)d-Frost-Temperatures.h5',
                'variety':'%(year)d-Frost-Apple-%(variety)s.h5',
               },
       'frost':{'chill':'%(year)d-Frost-Apple-Chill.h5',
                'temps':'%(year)d_temperatures.h5',
                'variety':'%(year)d-Frost-Apple-%(variety)s.h5',
               }
       }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# tool filetypes
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CONFIG.filetypes = { 'variety' : { 'scope':'season', 'period':'date', 
                                   'datasets':('lat','lon','stage',
                                               'T10','T50','T90',), 
                                   'start_day':PROJECT_START_DAY,
                                   'end_day':PROJECT_END_DAY,
                                   'description':'Daily Kill Probability'
                                 },
                     'temps' : { 'scope':'season', 'period':'date', 
                                 'datasets':('lat','lon','mint'), 
                                 'start_day':PROJECT_START_DAY,
                                 'end_day':PROJECT_END_DAY,
                                 'description':'Daily Temperature Extremes'
                               },
                   }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# mode-specific configurations
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CONFIG.modes = { 'build': { 'dirpaths': {
                 'build'    :'/Volumes/data/app_data/frapple/build',
                 'frost'    :'/Volumes/data/app_data/frost/grid',
                 'project'  :'/Volumes/data/app_data/frapple',
                 'shared'   :'/Volumes/data/app_data/shared',
                 'static'   :'/Volumes/data/app_data/shared/grid/static',
                 'tooldata' :'/Volumes/data/app_data/frapple/tool',
                 'working'  :'/Volumes/data/app_data' } }
               }

CONFIG.modes.prod = {
       'dirpaths': { 'project'  :'/app_data/frapple',
                     'resources':'/opt/tool_pkg/frapple/resources',
                     'appdata'  :'/app_data/shared',
                     'static'   :'/app_data/shared/static',
                     'tooldata' :'/app_data/frapple',
                     'working'  :'/app_data' },
       'server_address': 'http://tools.climatesmartfarming.org',
       'server_port': 20006,
       'server_url': 'http://tools.climatesmartfarming.org',
       'tool_url': 'http://tools.climatesmartfarming.org/frapple',
       }

CONFIG.modes.dev = {
       'csftool_url': 'http://localhost:8082/csftool',
       'default_year':2016, # first season with data
       'dirpaths': { 
            'build'    :'/Volumes/Transport/data/app_data/frapple/build',
            'frost'    :'/Volumes/Transport/data/app_data/frost',
            'project'  :'/Volumes/Transport/data/app_data/frapple',
            'resources':'/Volumes/Transport/venvs/apple/tool_pkg/frapple/dev-resources',
            'shared'   :'/Volumes/Transport/data/app_data/shared',
            'static'   :'/Volumes/Transport/data/app_data/static',
            'tooldata' :'/Volumes/Transport/data/app_data/frapple/tool',
            'working'  :'/Volumes/Transport/data/app_data' },
       'home': 'frapple.html',
       'server_address': 'file://localhost',
       'server_port': 8082,
       'server_url': 'http://localhost:8082',
       'tool_url': 'http://localhost:8082/frapple',
       }

CONFIG.modes.dev.copy('test', CONFIG.modes)
CONFIG.modes.test.update({
       'csftool_url': 'http://cyclone.nrcc.cornell.edu:8082/csftool',
       'home': 'frapple.html',
       'server_address': 'http://cyclone.nrcc.cornell.edu',
       'server_url': 'http://cyclone.nrcc.cornell.edu:8082',
       'tool_url': 'http://cyclone.nrcc.cornell.edu:8082/frapple',
       })
CONFIG.modes.test.dirpaths.resources = \
       '/Volumes/Transport/venvs/apple/tool_pkg/frapple/dev-resources'
       #'/Volumes/Transport/venvs/apple/tool_pkg/frapple/resources'

CONFIG.modes.dev.copy('wpdev', CONFIG.modes)
CONFIG.modes.wpdev.home = 'wpdev-frapple.html'

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# overrides to seasonal project config 
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CONFIG.project.end_day = PROJECT_END_DAY
CONFIG.project.region = 'NE'
CONFIG.project.root = 'frapple'
CONFIG.project.scopes = { 'normal':(1981,2010),
                          'por':(1981,9999),    # 9999 = year previous to target
                          'recent':(-15,9999) } # -n = number of years previous
CONFIG.project.shared_forecast = True
CONFIG.project.shared_source = True
CONFIG.project.start_day = PROJECT_START_DAY
CONFIG.project.source = 'acis'
CONFIG.project.subdir_path = \
               ('apple','tool','%(region)s','%(source)s','%(variety)s')

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# config resources & paths to files
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

resource_map = { '/' : ('page', 'file', ('pages','frapple.html')),
                 #'icons'   : ('icon',  'dir', 'icons'),
                 #'images'  : ('image', 'dir', 'images'),
                 'js'      : ('file',  'dir', 'js'),
                 'pages'   : ('page',  'dir', 'pages'),
                 'style'   : ('file',  'dir', 'style'),
                 'tool.js' : ('tool', 'dir', 'js'),
                 'tool-mgr.js' : ('tool', 'dir', 'js'),
                 'toolinit.js' : ('tool', 'dir', 'js'),
                 'frapple.html' : ('page',  'dir', 'pages'),
               }
CONFIG.resource_map = ConfigMap(resource_map)
del resource_map
# resources that require template validation
CONFIG.data_requests = ('daysInSeason', 'history', 'season', 'tempext')
CONFIG.templates = ( '/', '/frapple.html', '/js/tool.js', '/js/toolinit.js',)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# default server configuration
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CONFIG.server_address = 'http://cyclone.nrcc.cornell.edu'
CONFIG.server_port = 8082

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
#  defaults necessary for tool initialization
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

chart_labels = '{"trend":"30 Day Trend","season":"||season|| Season"'
chart_labels += ',"season_to_date":"Season Thru ||season_end||"}'
CONFIG.tool = { 'available_day':(10,15),
    # must be a javascript associative array as a string
    'button_labels': '{"season":"Full Season", "trend":"30 Day Trend"}',
    # must be a javascript associative array as a string
    'chart_labels':chart_labels,
    # must be a simple javascript array as a string
    'chart_required_series':'["mint","risk"]',
    # must be a simple javascript array as a string
    'chart_types':'["season", "trend"]',
    'data_region_key':'NE',              # region covered by the server
    'data_source_key':'acis',            # source of model data
    'days_in_view':30,                   # default number of days in view
    'default_chart': 'trend',
    'default_doi':(3,15),                # default date of interest
    #    NOTE: significant freeze events 2/11-15/2016 and 4/2-10/2016
    'default_variety': 'empire',         # default apple variety
    #    NOTE: variety most likely to exhibit freeze damage in any season
    'display_anchor':"#csftool-display",
    'first_season':2017,                 # first season with data
    'gdd_thresholds':((43,86),),
    'inherit_resources':'csftool',       # key to inherited set of resources
    'kill_temps':OrderedDict(zip(STAGES,KILL_TEMPS)), # ordered pairs
    'kill_index':1, 
    #'last_season':2017,                  # last season with data
    #    index of kill temp to use for plotting stages.
    'models':('carolina',),
    'season_description':'%(start_year)d-%(end_year)d Growing Season',
    'season_end_day':SEASON_END_DAY,     # last day required by tool
    'season_start_day':SEASON_START_DAY, # first day required by tool
    'stages':tuple(STAGES),              # ordered keywords for all stages
    'toolname':'frapple',                # name forwarding server knows
    'varieties':{'empire':{'description':'Empire Apple',},
                 'mac_geneva':{'description':'Macintosh Apple',},
                 'red_delicious':{'description':'Red Delicious Apple',},
                },
    }
del chart_labels

CONFIG.tool.html = {
       'display_anchor':"#csftool-display",
       'map_dialog_anchor':"#frapple-location-anchor",
       'map_dialog_container':'<div id="frapple-location-anchor"> </div>',
       }

# stage labels for chart - uses T10 kill temp as key (except dormant)
stages = OrderedDict(zip((11,19,22,25,27,38,29),
                         ('Silver Tip','Green Tip','1/2" Green',
                          'Tight Cluster','Pink Bud','Bloom','Petal Fall')
                        )
                     )
# must be a javascript associative array as a string
stages = ["'%d':'%s'" % item for item in stages.items()]
CONFIG.tool.stage_labels = '{%s}' % ','.join(stages).replace(', ',',')
del stages

# default location for this tool
CONFIG.tool.default_location = 'Appleseed'
CONFIG.tool.locations = { 
       'Appleseed': {'lat':42.282480, 'lon':-76.934862,
       'address': "Johnny Appleseed's Orchard, DeMunn Rd, Beaver Dams, NY"},
       #'BeakSkiff': {'lat':42.903461, 'lon':-76.222554,
       #'address': 'Beak & Skiff, 2705 Lords Hill Rd, Lafayette, NY'},
       #'Fishkill': {'lat':41.518224, 'lon':-73.823300,
       #'address': 'Fishkill Farms, 96 Fishkill Farm Rd, Hopewell Junction, NY'},
       #'Stonehill': {'lat':42.577255, 'lon':-78.919908,
       #'address': 'Stonehill Orchard, 2356 Shirley Rd, North Collins, NY'},
       #'Zappa': {'lat':45.450908, 'lon':-70.487016,
       #'address':"Joe's Garage, MidlONoWhe, Somerset County, ME"},
       }
CONFIG.tool.testLocation = {'id':'Zappa', 'lat':45.450908, 'lon':-70.487016,
            'address':"Joe's Garage, MidlONoWhe, Somerset County, ME"}


# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
#  apple varieties
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CONFIG.tool.varieties = {
        'empire':{
            'description':'Empire Apple', 'min_chill_units':1100, 
            'phenology':OrderedDict(zip(STAGES,(0,91,107,170,224,288,384,492)))
           },
        'mac_geneva':{
            'description':'Macintosh Apple',
            'min_chill_units':1100,
            'phenology':OrderedDict(zip(STAGES,(0,85,121,175,233,295,382,484)))
           },
        'red_delicious':{
            'description':'Red Delicious Apple', 'min_chill_units':1200, 
            'phenology': OrderedDict(zip(STAGES,(0,97,132,192,248,331,424,539)))
           }
        }

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
del KILL_TEMPS, STAGES
