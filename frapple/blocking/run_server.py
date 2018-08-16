#!/usr/bin/env python

import os, sys
import socket
import datetime

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from csftool.blocking.server  import CsfToolBlockingHttpServer
from csftool.utils import validateResourceConfiguration

from frapple.blocking.request import AppleFrostBlockingRequestManager

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('--demo', action='store_true', default=False, dest='demo_mode',
                  help='use demo mode for predetermined locations and test data')
parser.add_option('--doi', action='store', type='string', default=None, dest='doi',
                  help="initial date of interest, must be a string 'YYYY-MM-DD'")
parser.add_option('--log', action='store', type='string', default=None,
                  dest='log_filepath', help='specify path for Tornado log file')
parser.add_option('--page', action='store', type='string', default=None,
                  dest='tool_page', help='optional home page url')
parser.add_option('--pkg', action='store', type='string', default=None,
                  dest='pkg_dirpath',
                  help='alternate path to Grape Hardiness package directory')
parser.add_option('--port', action='store', type='int', default=None,
                  dest='server_port', help='alternate port for server')
parser.add_option('--region', action='store', type='string', default=None,
                  dest='region_key', help='name of alternate geographic region')
parser.add_option('--source', action='store', type='string', default=None,
                  dest='source_key', help='name of alternate data source')
parser.add_option('--tool', action='store', type='string', default=None,
                  dest='toolname', help='alternate name for tool in requests')

parser.add_option('-c', action='store_true', default=False, dest='csftool',
                  help='also serve csftool requests from this server')
parser.add_option('-d', action='store_true', default=False,
                  dest='dev_resources', help='use dev resource in test mode')
parser.add_option('-p', action='store_true', default=False, dest='prod_mode',
                  help='run server with production settings')
parser.add_option('-r', action='store_true', default=False,
                  dest='prod_resources',
                  help='use preduction resources in dev mode')
parser.add_option('-t', action='store_true', default=False, dest='test_mode',
                  help='run server with test settings')
parser.add_option('-w', action='store_true', default=False, dest='wpdev_mode',
                  help='use WordPress jQuery scripts in dev mode')
parser.add_option('-v', action='store_true', default=False, dest='verbose',
                  help='show verbose comments & output as code is executed')
parser.add_option('-z', action='store_true', default=False, dest='debug',
                  help='show all verbose and debug output as code is executed')

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

debug = options.debug
verbose = options.verbose or debug

# allow for specialized alternate tool configurations
if options.prod_mode: mode = "prod"
elif options.test_mode: mode = "test"
elif options.wpdev_mode: mode = "wpdev"
else: mode = "dev"
include_csftool = mode in ("dev", "test", "wpdev") or options.csftool

# import the default GDD server configuration
from frapple.config import CONFIG as TOOL_CONFIG
server_config = TOOL_CONFIG.copy()
# don't drag the tool config around
del TOOL_CONFIG

server_config.mode = mode
mode_config = server_config.modes[mode]
server_config.update(mode_config.attrs)
server_config.dirpaths = mode_config.dirpaths.attrs
if (mode == 'dev' and options.prod_resources):
    print "USING PROD RESOURCES IN DEV MODE"
    server_config.dirpaths.resources = \
           server_config.dirpaths.resources.replace('dev-','')
    print server_config.dirpaths.resources

elif (mode == "test" and options.dev_resources):
    print "USING DEV RESOURCES IN TEST MODE"
    server_config.dirpaths.resources = server_config.modes.dev.dirpaths.resources
    print server_config.dirpaths.resources

new_port = options.server_port
if new_port is not None:
    old_port_str = str(server_config.server_port)
    server_config.server_port = new_port
    new_port_str = str(new_port)
    url = server_config.server_url
    server_config.server_url = url.replace(old_port_str, new_port_str)
    url = server_config.csftool_url
    server_config.csftool_url = url.replace(old_port_str, new_port_str)
    url = server_config.gddtool_url
    server_config.gddtool_url = url.replace(old_port_str, new_port_str)
    
# validate the resources and get full path to each
server_config.resources = \
    { 'frapple': validateResourceConfiguration(server_config), }

if options.demo_mode:
    server_config.dates = server_config.demo.dates.copy('dates')
    server_config.season = server_config.demo.season

# look for a config overrides file
cfgfile = None
if 'CSF_FRAPPLE_CONFIG_PY' in os.environ:
    cfgfile = open(os.environ['CSF_FRAPPLE_CONFIG_PY'],'r')
else:
    dirpath = os.path.split(os.path.abspath(__file__))[0]
    filepath = os.path.join(dirpath, 'server_config.py')
    if os.path.exists(filepath):
        cfgfile = open(filepath,'r')
if cfgfile is not None:
    overrides = eval(cfgfile.read())
    cfgfile.close()
    server_config.update(overrides)

# apply overrides from command line
if options.source_key is not None:
    server_config.tool.data_source_key = options.source_key

if options.region_key is not None:
    server_config.tool.data_region_key = options.region_key

if options.pkg_dirpath is not None:
    server_config.dirpaths.package = os.path.abspath(options.pkg_dirpath)

if options.doi is not None: server_config.tool.default_doi = options.doi

# default location and JS object containing all locations
locations = [ ]
for key, loc in server_config.tool.locations.items():
    location_js = '%s:{doi:null' % key
    if 'variety' in loc:
        location_js = '%s,variety:"%s"' % (location_js, loc.variety)
    else: location_js = '%s,variety:null' % location_js
    location_js = '%s,lat:%.6f,lng:%.6f' % (location_js, loc.lat, loc.lon)
    locations.append('%s,address:"%s"}' % (location_js, loc.address))
server_config.tool.locations_js = '{%s}' % ','.join(locations)

# default variety and JS object containing all varieties
varieties = { }
varieties_js = [ ]
for key in server_config.tool.varieties:
    description = server_config.tool.varieties[key].description
    varieties[key] = description
    varieties_js.append('%s:"%s"' % (key,description))
server_config.tool.varieties = varieties
server_config.tool.varieties_js = '{%s}' % ','.join(varieties_js)

toolname = options.toolname
if toolname is not None: server_config.toolname = toolname
else: toolname = server_config.tool.toolname 

tool_page = options.tool_page
if tool_page is None: tool_page = server_config.get('home', None)
if tool_page is not None:
    abspath = os.path.abspath(tool_page)
    if not os.path.exists(abspath):
        resource_path = server_config.dirpaths.resources
        tool_page = os.path.join(resource_path, 'pages', tool_page)
        if not os.path.exists(tool_page):
            raise IOError, 'invalid file path for home page : %s' % tool_page
    else: tool_page = abspath 
    # create a new resources entry in the server config
    server_config.resources.frapple['/'] = ('page', 'file', tool_page)

if options.log_filepath is not None:
    import logging
    log_filepath = os.path.abspath(options.log_filepath)
    app_logger = logging.getLogger("tornado.application")
    app_logger.addHandler(logging.FileHandler(log_filepath))


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# track the pid for use by rc.d script
if len(args) > 0:
    pid_filepath = os.path.abspath(args[0])
    pid_file = open(pid_filepath, 'w')
    pid_file.write('%d' % os.getpid())
    pid_file.close()

server_config.debug = debug
server_config.verbose = verbose

# import the CSF tool configuration
if include_csftool:
    from csftool.config import CONFIG as CSFTOOL_CONFIG
    csftool_config = CSFTOOL_CONFIG.copy()
    del CSFTOOL_CONFIG
    # validate the resources and get full path to each
    dirpath = server_config.dirpaths.resources.replace('frapple','csftool')
    csftool_config.dirpaths.resources = \
        dirpath.replace('tool_pkg','csftool_pkg').replace('apple','csftool')
    server_config.resources.csftool = \
        validateResourceConfiguration(csftool_config)
    del csftool_config

# create a request manager
request_manager =  AppleFrostBlockingRequestManager(server_config)
if include_csftool:
    from csftool.blocking.files import CSFTOOL_FILE_HANDLERS
    request_manager.registerResponseHandlerClasses('csftool',
                                                   **CSFTOOL_FILE_HANDLERS)
if debug:
    if include_csftool:
        print '\n\nresponse_handlers[csftool]'
        for key, value in request_manager.response_handlers['csftool'].items():
            print '    ', key, '=', value
    print '\n\nresponse_handlers[frapple]'
    for key, value in request_manager.response_handlers['frapple'].items():
        print '    ', key, '=', value
    print '\n\n'

# create an HTTP server
http_server = CsfToolBlockingHttpServer(server_config, request_manager)
# run the server
http_server.run()

