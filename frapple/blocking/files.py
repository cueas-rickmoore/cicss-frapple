
import datetime

import tornado.template

from csftool.blocking.files import CsfToolBlockingFileHandler
from csftool.blocking.files import CsfToolBlockingImageFileHandler

from frapple.blocking.handler import AppleFrostBlockingRequestHandler
from frapple.blocking.handler import AppleFrostVarietyRequestHandler

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

TOOL_FILE_HANDLERS = { 'file' : CsfToolBlockingFileHandler,
                       'icon' : CsfToolBlockingImageFileHandler,
                       'image' : CsfToolBlockingImageFileHandler,
                       'toolinit.js': CsfToolBlockingFileHandler
                     }

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class TemplateHandlerMethods:

    def __call__(self, request):
        if self.debug:
            print '\nAppleFrostTemplateHandlerMethods'
            print "    processing request for", request.uri

        resource_path = self.getResourcePath(request.uri)
        if self.debug: print 'resource path', resource_path

        with open(resource_path, 'r') as _file_:
            template = tornado.template.Template(_file_.read())

        request_dict = self.requestAsDict(request)
        parameters = self.extractTemplateParameters(request_dict)
        content = template.generate(csf_server_url=self.getHostUrl(request),
                                    **parameters)

        content = content.replace('&quot;','"').replace("&#39;","'")
        request.write(self.constructResponse(content))
    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractTemplateParameters(self, request_dict):
        return self.extractServerParameters(request_dict)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractServerParameters(self, request_dict):
        server_url = self.server_config.server_url
        params = { 'server_url':server_url, }
        if 'tool_url' in self.server_config:
            params['tool_url'] = self.server_config.tool_url
        if 'csftool_url' in self.server_config:
            params['csftool_url'] = self.server_config.csftool_url
        else: params['csftool_url'] = "%s/csftool"  % server_url
        return params


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostBlockingTemplateHandler(TemplateHandlerMethods,
                                        AppleFrostBlockingRequestHandler):
    """ add contents of a file to the response.
    Primarily used for accessing local css and javascript files.
    """

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

TOOL_FILE_HANDLERS['/'] = AppleFrostBlockingTemplateHandler
TOOL_FILE_HANDLERS['page'] = AppleFrostBlockingTemplateHandler
TOOL_FILE_HANDLERS['template'] = AppleFrostBlockingTemplateHandler

TOOL_FILE_HANDLERS['wpdev-frapple.html'] = \
                    AppleFrostBlockingTemplateHandler
TOOL_FILE_HANDLERS['load-dependencies.js'] = \
                    AppleFrostBlockingTemplateHandler


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostBlockingInitHandler(TemplateHandlerMethods,
                                    AppleFrostVarietyRequestHandler):
    """ Assemble configuration parameters for the tool initialization script.
    """

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractTemplateParameters(self, request_dict):
        # start with dates of current season 
        parameters = self.extractServerParameters(request_dict)

        # deafult season parameters
        year  = self.mode_config.get('season', None)
        if year is None: year = datetime.date.today().year
        elif isinstance(year, basestring): year = int(year)
        parameters['season'] = year

        season_end_day = list(self.tool.season_end_day)
        parameters['season_end_day'] = season_end_day
        parameters['season_end'] = \
            self.appDateFormat(self.seasonEndDate(year))

        season_start_day = list(self.tool.season_start_day)
        parameters['season_start_day'] = season_start_day
        parameters['season_start'] = \
            self.appDateFormat(self.seasonStartDate(year))
        description = self.tool.season_description
        parameters['season_description'] = \
            description % {'start_year':year-1, 'end_year':year }

        # add default date of interest
        default_doi = self.tool.default_doi
        if not isinstance(default_doi, basestring): # needs to be YYYY-MM_DD
            default_doi = \
                self.appDateFormat(self.dayToSeasonDate(year,default_doi))
        parameters['default_doi'] = default_doi 
        parameters['doi'] = default_doi

        parameters['days_in_view'] = self.tool.days_in_view

        # add viriety deafults
        parameters['default_variety'] = self.tool.default_variety
        parameters['varieties_js'] = self.tool.varieties_js

        # check for multiple years ... always a sequence
        parameters['min_year'] = self.tool.first_season
        if parameters['min_year'] is None:
            today = datetime.date.today()
            parameters['min_year'] = self.maxAvailableYear(today)
            parameters['max_year'] = parameters['min_year']
        else:
            max_year = self.tool.get('last_season',None)
            if max_year is None:
                today = datetime.date.today()
                max_year = self.maxAvailableYear(today)
            parameters['max_year'] = max_year

        # add location parameters
        loc_key = self.tool.default_location
        location = self.tool.locations[loc_key]
        parameters['loc_lat'] = location.lat
        parameters['loc_lng'] = location.lon
        parameters['loc_key'] = location.name
        parameters['loc_address'] = location.address
        parameters['locations_js'] = self.tool.locations_js

        # prameters specific to toolint.js script initialization
        parameters['button_labels'] = self.tool.button_labels
        parameters['chart_labels'] = self.tool.chart_labels
        parameters['stage_labels'] = self.tool.stage_labels
        parameters['chart_types'] = self.tool.chart_types
        parameters['default_chart'] = self.tool.default_chart
        parameters['server_url'] = self.server_config.server_url
        parameters['toolname'] = self.toolname

        return parameters

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

TOOL_FILE_HANDLERS['tool'] = AppleFrostBlockingInitHandler
TOOL_FILE_HANDLERS['tool.js'] = AppleFrostBlockingInitHandler
#TOOL_FILE_HANDLERS['toolinit.js'] = AppleFrostBlockingInitHandler

